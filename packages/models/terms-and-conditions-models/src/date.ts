export type TermsLang = "en" | "it";

// Month names are pinned here, NOT read from runtime ICU locale data. This string feeds
// the legal-proof digest (via toAcceptedText), which must stay byte-stable and
// re-verifiable for years independent of the Node/browser ICU version.
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

// Same formatter for both the displayed date and the digest input, so the two can't
// diverge (ST.4). The calendar day is always derived in Europe/Rome (D5) — the document's
// legal day is the Italian civil day, regardless of the server's TZ. Intl is used only to
// pick that day/month/year numerically (IANA TZ data is stable); the month NAME comes from
// the pinned table above.
export function formatTermsDate(date: Date, lang: TermsLang): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "numeric",
    month: "numeric",
    timeZone: "Europe/Rome",
    year: "numeric",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? "";
  const day = Number(part("day"));
  const month = Number(part("month"));
  const year = part("year");
  return `${day} ${MONTH_NAMES[lang][month - 1]} ${year}`;
}
