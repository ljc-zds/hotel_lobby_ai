import { createFileRoute } from '@tanstack/react-router';

import { HotelSite } from '@/blocks/hotel-site';

export const Route = createFileRoute('/pricing')({
  head: () => ({ meta: [{ title: '价格 · Hotel Lobby AI' }] }),
  component: () => <HotelSite page="pricing" />,
});
