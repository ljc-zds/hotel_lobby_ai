import { createHash, randomUUID } from 'node:crypto';

import { config } from '@/config/db/schema';

export type ConversionEvent = {
  id: string;
  name: 'sign_up' | 'start_video' | 'payment_success';
  createdAt: string;
  deliveredAt: string | null;
};
export function conversionPrefix(userId: string) {
  return `conversion:${createHash('sha256').update(userId).digest('hex')}:`;
}
// Only anonymous conversion counts leave the server: no financial details,
// account identifiers, images or prompts. The source hash stays server-side.
export async function queueConversion(
  database: any,
  userId: string,
  name: ConversionEvent['name'],
  sourceId: string
) {
  const key = createHash('sha256').update(`${name}:${sourceId}`).digest('hex');
  const event: ConversionEvent = {
    id: randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    deliveredAt: null,
  };
  await database
    .insert(config)
    .values({
      name: conversionPrefix(userId) + key,
      value: JSON.stringify(event),
    })
    .onConflictDoNothing();
}
