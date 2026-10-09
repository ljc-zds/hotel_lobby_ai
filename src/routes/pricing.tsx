import { createFileRoute } from '@tanstack/react-router';

import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { HotelSite } from '@/blocks/hotel-site';

export const Route = createFileRoute('/pricing')({
  loader: () => ({
    title: m['hotel.meta.pricing']({}, { locale: getLocale() }),
  }),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: loaderData.title }] : [],
  }),
  component: () => <HotelSite page="pricing" />,
});
