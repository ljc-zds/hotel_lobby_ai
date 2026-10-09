import { createFileRoute } from '@tanstack/react-router';

import { filterPublicConfigs, getAllConfigs } from '@/modules/config/service';
import { respData } from '@/lib/resp';

const noStore = {
  headers: {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  },
};

const publicKeys = [
  'app_name',
  'app_description',
  'app_logo',
  'email_auth_enabled',
  'google_auth_enabled',
  'google_one_tap_enabled',
  'google_client_id',
  'github_auth_enabled',
  'invite_code_required',
  // Custom URL schemes /auth-callback may hand a session token to.
  'desktop_auth_schemes',
  'select_payment_enabled',
  'default_payment_provider',
  'stripe_enabled',
  'creem_enabled',
  'paypal_enabled',
  'alipay_enabled',
  'wechat_enabled',
  'google_analytics_id',
  'plausible_domain',
  'plausible_src',
];

function isEmailSendingConfigured(configs: Record<string, string>): boolean {
  const provider = configs.email_provider || 'resend';
  if (provider === 'cloudflare') {
    return (
      !!configs.cloudflare_email_api_token &&
      !!configs.cloudflare_email_account_id &&
      !!configs.cloudflare_email_sender_email
    );
  }
  return !!configs.resend_api_key && !!configs.resend_sender_email;
}

async function GET({ request }: { request: Request }) {
  const configs = await getAllConfigs();
  const result = filterPublicConfigs(configs, publicKeys);
  // Expose readiness only; provider secrets never leave the server.
  for (const provider of ['google', 'github']) {
    result[`${provider}_auth_ready`] =
      configs[`${provider}_auth_enabled`] === 'true' &&
      !!configs[`${provider}_client_id`] &&
      !!configs[`${provider}_client_secret`]
        ? 'true'
        : 'false';
  }
  const emailConfigured = isEmailSendingConfigured(configs);
  result.password_reset_enabled =
    configs.email_auth_enabled !== 'false' && emailConfigured
      ? 'true'
      : 'false';
  result.email_verification_enabled =
    configs.email_verification_enabled === 'true' && emailConfigured
      ? 'true'
      : 'false';
  return respData(result, noStore);
}

export const Route = createFileRoute('/api/config/public')({
  server: {
    handlers: { GET },
  },
});
