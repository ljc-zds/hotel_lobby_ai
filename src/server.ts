import handler from '@tanstack/react-start/server-entry';

import { getCookieFromHeader } from './lib/cookie';
import { withPublicPageCache } from './lib/public-page-cache';
import { paraglideMiddleware } from './paraglide/server.js';

// On Cloudflare Workers, stash the binding env (D1, ASSETS, …) on globalThis
// so synchronous code paths (e.g. the db() singleton with DATABASE_PROVIDER=d1)
// can reach bindings without threading the request context through every call.
// The specifier is kept non-literal so bundlers leave the import to runtime;
// outside workerd the import rejects and we just move on.
const CF_WORKERS_MODULE = 'cloudflare:workers';
let cfEnvPromise: Promise<void> | null = null;

function ensureCloudflareEnv(): Promise<void> {
  if (!cfEnvPromise) {
    cfEnvPromise = import(/* @vite-ignore */ CF_WORKERS_MODULE)
      .then((mod) => {
        (globalThis as any).__CF_ENV__ = mod.env;
      })
      .catch(() => {
        // Not running on Cloudflare Workers — nothing to stash.
      });
  }
  return cfEnvPromise;
}

// Custom server entry — wraps every request in Paraglide's middleware so
// getLocale() resolves per-request (AsyncLocalStorage) during SSR.
export default {
  async fetch(req: Request): Promise<Response> {
    return withPublicPageCache(req, async () => {
      // WordPress probes must not render our 404 shell: its root loader reads DB config.
      let pathname = new URL(req.url).pathname;
      try {
        pathname = decodeURIComponent(pathname);
      } catch {
        return new Response('Bad Request', { status: 400 });
      }
      if (
        /^\/(?:wp-admin(?:\/|$)|wp-login\.php(?:\/|$)|xmlrpc\.php(?:\/|$))/i.test(
          pathname
        )
      ) {
        return new Response(req.method === 'HEAD' ? null : 'Not Found', {
          status: 404,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store',
          },
        });
      }
      await ensureCloudflareEnv();
      const response = await paraglideMiddleware(req, () => handler.fetch(req));
      const utmSource = new URL(req.url).searchParams.get('utm_source');
      const existing = getCookieFromHeader(
        req.headers.get('cookie'),
        'utm_source'
      );
      if (utmSource && !existing) {
        const sanitized = utmSource.replace(/[^\w.\-]/g, '').slice(0, 100);
        if (sanitized) {
          response.headers.append(
            'Set-Cookie',
            `utm_source=${sanitized}; Max-Age=2592000; Path=/; SameSite=Lax`
          );
        }
      }
      return response;
    });
  },
};
