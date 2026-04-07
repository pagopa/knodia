const formatter = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 0,
  useGrouping: true,
});

export const formatNumber = (value: number) => formatter.format(value);

const shortDateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const formatShortDate = (value: string) =>
  shortDateFormatter.format(new Date(value));
