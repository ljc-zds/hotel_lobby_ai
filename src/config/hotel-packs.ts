import { VIDEO_CREDIT_COST } from './video';

/** Shared by the pricing page and authoritative checkout catalog. */
export const hotelPacks = [
  { id: 'hotel_single', name: 'Single Trial', videos: 1, priceInCents: 499 },
  { id: 'hotel_starter', name: 'Starter Pack', videos: 2, priceInCents: 990 },
  { id: 'hotel_creator', name: 'Creator Pack', videos: 5, priceInCents: 1990 },
  { id: 'hotel_studio', name: 'Bulk Pack', videos: 9, priceInCents: 2990 },
].map((pack) => ({ ...pack, credits: pack.videos * VIDEO_CREDIT_COST }));
