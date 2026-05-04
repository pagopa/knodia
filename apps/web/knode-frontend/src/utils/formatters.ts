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

const numericDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

export const formatNumericDate = (value: string) =>
  numericDateFormatter.format(new Date(value)).replace(/\//g, ".");
