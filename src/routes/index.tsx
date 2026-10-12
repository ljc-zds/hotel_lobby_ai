import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { getLocale, localizeUrl } from '@/paraglide/runtime.js';
import { HotelSite } from '@/blocks/hotel-site';

export const Route = createFileRoute('/')({
  loader: () => {
    const locale = getLocale();
    const url = localizeUrl(new URL('/', envConfigs.app_url), { locale }).href;
    return {
      title: m['hotel.meta.home']({}, { locale }),
      description: m['hotel.seo.description']({}, { locale }),
      url,
      locale,
    };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.title },
          { name: 'description', content: loaderData.description },
          { property: 'og:title', content: loaderData.title },
          { property: 'og:description', content: loaderData.description },
          { property: 'og:url', content: loaderData.url },
          { name: 'twitter:title', content: loaderData.title },
          { name: 'twitter:description', content: loaderData.description },
        ]
      : [],
    links: loaderData ? [{ rel: 'canonical', href: loaderData.url }] : [],
    scripts: loaderData
      ? [
          {
            type: 'application/ld+json',
            children: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: envConfigs.app_name,
              url: loaderData.url,
              description: loaderData.description,
              inLanguage: loaderData.locale,
            }).replace(/</g, '\\u003c'),
          },
        ]
      : [],
  }),
  component: () => <HotelSite page="home" />,
});
