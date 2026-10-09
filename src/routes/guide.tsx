import { createFileRoute } from '@tanstack/react-router';

import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { HotelSite } from '@/blocks/hotel-site';

export const Route = createFileRoute('/guide')({
  loader: () => ({ title: m['hotel.meta.guide']({}, { locale: getLocale() }) }),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: loaderData.title }] : [],
  }),
  component: () => <HotelSite page="guide" />,
});
