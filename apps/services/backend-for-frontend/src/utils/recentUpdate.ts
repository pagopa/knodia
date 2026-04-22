export const getRecentUpdateCutoffDate = (recentUpdateDays: number): Date => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - recentUpdateDays);
  return cutoff;
};

export const hasRecentlyBeenUpdated = (
  resource: { updatedAt: string },
  recentUpdateDays: number,
): boolean =>
  new Date(resource.updatedAt) >= getRecentUpdateCutoffDate(recentUpdateDays);
