export const conversionQueryOptions = {
  staleTime: Infinity,
  refetchInterval: false,
  refetchOnMount: 'always',
  refetchOnWindowFocus: 'always',
  refetchOnReconnect: 'always',
} as const;

export const conversionQueryKey = (userId?: string) =>
  ['conversion-events', userId] as const;

export function videoListPollingInterval(
  isOrdersPage: boolean,
  videos: readonly { status: string }[] | undefined
) {
  return isOrdersPage &&
    videos?.some((video) => ['pending', 'processing'].includes(video.status))
    ? 10_000
    : false;
}
