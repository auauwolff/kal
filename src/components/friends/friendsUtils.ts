export const friendInitials = (displayName: string, username: string): string => {
  const cleanedName = displayName.trim();
  if (cleanedName) {
    const words = cleanedName.split(/\s+/);
    if (words.length >= 2 && words[0] && words[1]) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return cleanedName.slice(0, 2).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase() || '??';
};

export const formatJoinedAt = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-AU', {
    month: 'short',
    year: 'numeric',
  });
};
