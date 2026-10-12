import { writeFile } from 'node:fs/promises';

const urls = [
  'https://hotellobby.ai/assets/templates/orange-street-duo-poster-v7.webp',
  'https://hotellobby.ai/assets/templates/orange-formal-duo-poster-v3.webp',
  'https://hotellobby.ai/assets/templates/orange-retro-duo-poster-v3.webp',
  'https://hotellobby.ai/assets/templates/orange-cats-poster-v3.webp',
  'https://hotellobby.ai/assets/templates/orange-fox-panda-poster-v3.webp',
  'https://hotellobby.ai/assets/templates/orange-corgis-poster-v3.webp',
  'https://hotellobby.ai/assets/templates/marble-checkin-poster-v3.webp',
  'https://hotellobby.ai/assets/templates/neon-elevator-poster-v3.webp',
  'https://hotellobby.ai/assets/templates/moon-gate-poster-v3.webp',
  'https://hotellobby.ai/assets/templates/wedding-lounge-poster-v3.webp',
  'https://hotellobby.ai/assets/templates/gold-atrium-poster-v3.webp',
  'https://hotellobby.ai/assets/templates/fox-panda-poster-v3.webp',
  'https://hotellobby.ai/assets/templates/cat-jazz-poster-v3.webp',
  'https://hotellobby.ai/assets/templates/corgi-rooftop-poster-v3.webp',
  'https://hotellobby.ai/assets/brand/hotellobby-mark-clean.webp',
  'https://hotellobby.ai/assets/templates/orange-street-duo-v6.mp4',
  'https://hotellobby.ai/assets/templates/orange-formal-duo-v2.mp4',
  'https://hotellobby.ai/assets/templates/orange-retro-duo-v2.mp4',
  'https://hotellobby.ai/assets/templates/orange-cats-v2.mp4',
  'https://hotellobby.ai/assets/templates/orange-fox-panda-v2.mp4',
  'https://hotellobby.ai/assets/templates/orange-corgis-v2.mp4',
  'https://hotellobby.ai/assets/templates/marble-checkin-v2.mp4',
  'https://hotellobby.ai/assets/templates/neon-elevator-v2.mp4',
  'https://hotellobby.ai/assets/templates/moon-gate-v2.mp4',
  'https://hotellobby.ai/assets/templates/wedding-lounge-v2.mp4',
  'https://hotellobby.ai/assets/templates/gold-atrium-v2.mp4',
  'https://hotellobby.ai/assets/templates/fox-panda-v2.mp4',
  'https://hotellobby.ai/assets/templates/cat-jazz-v2.mp4',
  'https://hotellobby.ai/assets/templates/corgi-rooftop-v2.mp4',
];
for (let i = 0; i < urls.length; i += 4)
  await Promise.all(
    urls.slice(i, i + 4).map(async (url) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(url + ' ' + r.status);
      await writeFile(
        'public/reference/' + url.split('/').pop(),
        Buffer.from(await r.arrayBuffer())
      );
      console.log(url.split('/').pop());
    })
  );
