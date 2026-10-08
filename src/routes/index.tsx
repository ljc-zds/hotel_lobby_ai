import { createFileRoute } from '@tanstack/react-router';

import { HotelSite } from '@/blocks/hotel-site';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: '双人视频创作模板 · Hotel Lobby AI' }] }),
  component: () => <HotelSite page="home" />,
});
