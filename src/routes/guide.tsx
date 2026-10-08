import { createFileRoute } from '@tanstack/react-router';

import { HotelSite } from '@/blocks/hotel-site';

export const Route = createFileRoute('/guide')({
  head: () => ({ meta: [{ title: '创作指南 · Hotel Lobby AI' }] }),
  component: () => <HotelSite page="guide" />,
});
