export const toISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const todayISO = (): string => toISODate(new Date());

export const shiftISODate = (iso: string, days: number): string => {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toISODate(date);
};

export const formatDayLabel = (iso: string): string => {
  const today = todayISO();
  const yesterday = shiftISODate(today, -1);
  if (iso === today) return 'Today';
  if (iso === yesterday) return 'Yesterday';

  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};
