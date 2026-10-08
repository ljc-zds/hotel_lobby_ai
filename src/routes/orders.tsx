import { createFileRoute } from '@tanstack/react-router';

import { HotelSite } from '@/blocks/hotel-site';

export const Route = createFileRoute('/orders')({
  head: () => ({ meta: [{ title: '我的作品 · Hotel Lobby AI' }] }),
  component: () => <HotelSite page="orders" />,
});
