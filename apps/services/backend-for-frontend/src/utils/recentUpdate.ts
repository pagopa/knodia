export const hasRecentlyBeenUpdated = (
  resource: { updatedAt: string },
  recentUpdateDays: number,
): boolean => {
  const updatedAt = new Date(resource.updatedAt);
  const xDaysAgo = new Date();
  xDaysAgo.setDate(xDaysAgo.getDate() - recentUpdateDays);

  return updatedAt >= xDaysAgo;
};
