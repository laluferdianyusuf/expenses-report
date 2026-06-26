export function formatRelativeTime(date: string | Date): string {
  const then = new Date(date).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}j`;
  if (diffDays < 7) return `${diffDays}h`;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(date));
}
