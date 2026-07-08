import { type SignupUser, SuspensionReason } from "@knodia/signup-models";
import { match } from "ts-pattern";

type SuspendedSignupUser = Extract<SignupUser, { status: "Suspended" }>;

const CSV_HEADERS = [
  "ID utente",
  "Nome",
  "Cognome",
  "Email",
  "Data di nascita",
  "Codice fiscale",
  "Identificativo persona",
  "Codice SPID",
  "Sospeso il",
  "Motivo",
  "Motivo (codice)",
  "Creato il",
  "Aggiornato il",
  "Organizzazione Lynx",
  "Utente Lynx",
  "Organizzazione Orion",
  "Utente Orion",
];

// Build the formatter once: static config, reused for every timestamp.
const ROME_DATE_TIME_FORMAT = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Rome",
  year: "numeric",
});

// Leading UTF-8 BOM + ';' separator + CRLF so Italian Excel opens it correctly.
export function buildSuspendedUsersCsv(users: SuspendedSignupUser[]): string {
  const rows = users.map((u) =>
    [
      u.signupUserId,
      u.name,
      u.familyName,
      u.email,
      formatDate(u.dateOfBirth),
      u.fiscalNumber,
      u.personIdentifier,
      u.spidCode,
      formatDateTime(u.suspendedAt),
      suspensionReasonLabel(u.suspensionReason),
      u.suspensionReason,
      formatDateTime(u.createdAt),
      formatDateTime(u.updatedAt),
      u.generatedEntities.Lynx.organizationName,
      u.generatedEntities.Lynx.userName,
      u.generatedEntities.Orion.organizationName,
      u.generatedEntities.Orion.userName,
    ]
      .map(csvField)
      .join(";"),
  );

  const lines = [CSV_HEADERS.map(csvField).join(";"), ...rows];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

// Single line on purpose: Gmail trims a trailing line that repeats verbatim
// across messages in a group thread. Folding everything into one line that
// always carries the timestamp keeps each email's body unique.
export function buildSuspendedUsersEmailBody(total: number, now: Date): string {
  return `In allegato l'elenco degli utenti sospesi su Knodia, ordinato dalla sospensione più recente alla meno recente. Utenti totali: ${total}, aggiornato al ${formatDateTime(now)} (Europe/Rome).`;
}

/** `gg/mm/aaaa` — birth date is a calendar date, formatted without a timezone. */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

/** `aaaa-mm-gg` in Europe/Rome, for the attachment filename. */
export function formatDateStamp(date: Date): string {
  const p = romeDateParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

/** `gg/mm/aaaa hh:mm` in Europe/Rome. */
export function formatDateTime(date: Date): string {
  const p = romeDateParts(date);
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}

// Quote/escape per RFC 4180; separator is ';' for Excel-IT.
function csvField(value: string | undefined): string {
  const v = value ?? "";
  return /[;"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function romeDateParts(date: Date): {
  day: string;
  hour: string;
  minute: string;
  month: string;
  year: string;
} {
  const parts = ROME_DATE_TIME_FORMAT.formatToParts(date);
  const get = (type: string): string =>
    parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    month: get("month"),
    year: get("year"),
  };
}

// Labels mirror the GDPR Art. 18 references shown to users when they pick a reason.
function suspensionReasonLabel(reason: SuspensionReason): string {
  return match(reason)
    .with(
      SuspensionReason.enum.AccuracyContested,
      () => "Esattezza dei dati contestata (Art. 18.1.(a) GDPR)",
    )
    .with(
      SuspensionReason.enum.UnlawfulProcessing,
      () => "Trattamento illecito (Art. 18.1.(b) GDPR)",
    )
    .with(
      SuspensionReason.enum.DataNeededForLegalClaims,
      () =>
        "Dati necessari per accertamento/esercizio/difesa di un diritto in giudizio (Art. 18.1.(c) GDPR)",
    )
    .with(
      SuspensionReason.enum.PendingObjectionVerification,
      () => "Verifica dell'opposizione in corso (Art. 18.1.(d) GDPR)",
    )
    .exhaustive();
}
