export type TermsLang = "en" | "it";

// Month names pinned here, not from runtime ICU data: this string feeds the legal-proof
// digest, which must stay byte-stable and re-verifiable independent of the ICU version.
const MONTH_NAMES: Record<TermsLang, readonly string[]> = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  it: [
    "gennaio",
    "febbraio",
    "marzo",
    "aprile",
    "maggio",
    "giugno",
    "luglio",
    "agosto",
    "settembre",
    "ottobre",
    "novembre",
    "dicembre",
  ],
};

// Calendar day always derived in Europe/Rome: the legal day is the Italian civil day,
// regardless of server TZ. Intl supplies only the numeric day/month/year (IANA TZ data is
// stable); the month name comes from the pinned table, never from ICU.
export function formatTermsDate(date: Date, lang: TermsLang): string {
  const parts = new Intl.DateTimeFormat("it", {
    day: "numeric",
    month: "numeric",
    timeZone: "Europe/Rome",
    year: "numeric",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes): string | undefined =>
    parts.find((p) => p.type === type)?.value;
  const day = Number(part("day"));
  const month = Number(part("month"));
  const year = part("year");
  const monthName = MONTH_NAMES[lang].at(month - 1);
  if (monthName === undefined || year === undefined || Number.isNaN(day)) {
    throw new Error(`Cannot format T&C date: ${date.toISOString()}`);
  }
  return `${day} ${monthName} ${year}`;
}
