const formatter = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 0,
  useGrouping: true,
});

export const formatNumber = (value: number) => formatter.format(value);

const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const formatShortDate = (value: string) =>
  shortDateFormatter.format(new Date(value));
