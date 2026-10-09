import type { HotelTrack } from '@/types/hotel';

import { m } from '@/paraglide/messages.js';

export function getHotelTracks(locale?: 'en' | 'zh'): HotelTrack[] {
  return [
    {
      id: 'orange-street-duo',
      title: m['hotel.copy.orange_street_duo_132'](
        {},
        locale ? { locale } : undefined
      ),
      description: m['hotel.copy.a_plain_orange_studio_a_suspended_133'](
        {},
        locale ? { locale } : undefined
      ),
      category: 'people',
      image: '/reference/orange-street-duo-poster-v7.webp',
    },
    {
      id: 'orange-formal-duo',
      title: m['hotel.copy.orange_formal_duo_134'](
        {},
        locale ? { locale } : undefined
      ),
      description: m[
        'hotel.copy.modern_formalwear_a_plain_orange_background_135'
      ]({}, locale ? { locale } : undefined),
      category: 'people',
      image: '/reference/orange-formal-duo-poster-v3.webp',
    },
    {
      id: 'orange-retro-duo',
      title: m['hotel.copy.orange_retro_duo_136'](
        {},
        locale ? { locale } : undefined
      ),
      description: m['hotel.copy.y2k_streetwear_a_plain_orange_studio_137'](
        {},
        locale ? { locale } : undefined
      ),
      category: 'people',
      image: '/reference/orange-retro-duo-poster-v3.webp',
    },
    {
      id: 'orange-cats',
      title: m['hotel.copy.orange_cats_duo_138'](
        {},
        locale ? { locale } : undefined
      ),
      description: m['hotel.copy.a_black_cat_and_an_orange_139'](
        {},
        locale ? { locale } : undefined
      ),
      category: 'animals',
      image: '/reference/orange-cats-poster-v3.webp',
    },
    {
      id: 'orange-fox-panda',
      title: m['hotel.copy.orange_fox_red_panda_140'](
        {},
        locale ? { locale } : undefined
      ),
      description: m['hotel.copy.a_red_fox_and_a_red_141'](
        {},
        locale ? { locale } : undefined
      ),
      category: 'animals',
      image: '/reference/orange-fox-panda-poster-v3.webp',
    },
    {
      id: 'orange-corgis',
      title: m['hotel.copy.orange_corgis_duo_142'](
        {},
        locale ? { locale } : undefined
      ),
      description: m['hotel.copy.two_corgis_follow_the_beat_in_143'](
        {},
        locale ? { locale } : undefined
      ),
      category: 'animals',
      image: '/reference/orange-corgis-poster-v3.webp',
    },
    {
      id: 'marble-checkin',
      title: m['hotel.copy.marble_checkin_duet_144'](
        {},
        locale ? { locale } : undefined
      ),
      description: m[
        'hotel.copy.a_latenight_marble_reception_desk_central_145'
      ]({}, locale ? { locale } : undefined),
      category: 'people',
      image: '/reference/marble-checkin-poster-v3.webp',
    },
    {
      id: 'neon-elevator',
      title: m['hotel.copy.neon_elevator_exchange_146'](
        {},
        locale ? { locale } : undefined
      ),
      description: m['hotel.copy.a_metallic_elevator_lobby_cool_blue_147'](
        {},
        locale ? { locale } : undefined
      ),
      category: 'people',
      image: '/reference/neon-elevator-poster-v3.webp',
    },
    {
      id: 'moon-gate',
      title: m['hotel.copy.moon_gate_duo_148'](
        {},
        locale ? { locale } : undefined
      ),
      description: m[
        'hotel.copy.original_formalwear_moongate_lighting_and_an_149'
      ]({}, locale ? { locale } : undefined),
      category: 'culture',
      image: '/reference/moon-gate-poster-v3.webp',
    },
    {
      id: 'wedding-lounge',
      title: m['hotel.copy.modern_lounge_duo_150'](
        {},
        locale ? { locale } : undefined
      ),
      description: m[
        'hotel.copy.modern_formalwear_a_boutique_hotel_lounge_151'
      ]({}, locale ? { locale } : undefined),
      category: 'people',
      image: '/reference/wedding-lounge-poster-v3.webp',
    },
    {
      id: 'gold-atrium',
      title: m['hotel.copy.golden_atrium_anthem_152'](
        {},
        locale ? { locale } : undefined
      ),
      description: m[
        'hotel.copy.original_patterned_outfits_a_brass_atrium_153'
      ]({}, locale ? { locale } : undefined),
      category: 'culture',
      image: '/reference/gold-atrium-poster-v3.webp',
    },
    {
      id: 'fox-panda',
      title: m['hotel.copy.concierge_fox_red_panda_154'](
        {},
        locale ? { locale } : undefined
      ),
      description: m['hotel.copy.two_miniature_concierges_play_around_a_155'](
        {},
        locale ? { locale } : undefined
      ),
      category: 'animals',
      image: '/reference/fox-panda-poster-v3.webp',
    },
    {
      id: 'cat-jazz',
      title: m['hotel.copy.velvet_cats_jazz_night_156'](
        {},
        locale ? { locale } : undefined
      ),
      description: m['hotel.copy.two_cats_one_vintage_microphone_and_157'](
        {},
        locale ? { locale } : undefined
      ),
      category: 'animals',
      image: '/reference/cat-jazz-poster-v3.webp',
    },
    {
      id: 'corgi-rooftop',
      title: m['hotel.copy.corgi_rooftop_party_158'](
        {},
        locale ? { locale } : undefined
      ),
      description: m['hotel.copy.a_bluehour_city_skyline_a_low_159'](
        {},
        locale ? { locale } : undefined
      ),
      category: 'animals',
      image: '/reference/corgi-rooftop-poster-v3.webp',
    },
  ];
}
