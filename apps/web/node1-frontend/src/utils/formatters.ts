const formatter = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 0,
  useGrouping: true,
});

export const formatNumber = (value: number) => formatter.format(value);
