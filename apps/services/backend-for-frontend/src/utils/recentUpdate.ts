export const hasRecentlyBeenUpdated = (
  dateString: string,
  recentUpdateDays: number,
): boolean => {
  const updatedAt = new Date(dateString);
  const xDaysAgo = new Date();
  xDaysAgo.setDate(xDaysAgo.getDate() - recentUpdateDays);

  return updatedAt >= xDaysAgo;
};
