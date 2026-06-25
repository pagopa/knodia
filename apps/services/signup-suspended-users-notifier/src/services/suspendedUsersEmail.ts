import {
  type SuspendedSignupUser,
  SuspensionReason,
} from "@knodia/signup-models";
import { match } from "ts-pattern";

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

/**
 * One row per Suspended user, ordering preserved from the query. Leading UTF-8
 * BOM + `;` separator + CRLF so Italian Excel opens it with correct columns
 * and accents.
 */
export function buildSuspendedUsersCsv(users: SuspendedSignupUser[]): string {
  const rows = users.map((u) =>
    [
      u.signupUserId,
      u.name,
      u.familyName,
      u.email,
      formatIsoDate(u.dateOfBirth),
      u.fiscalNumber,
      u.personIdentifier,
      u.spidCode,
      formatDateTimeRome(u.suspendedAt),
      suspensionReasonLabel(u.suspensionReason),
      u.suspensionReason,
      formatDateTimeRome(u.createdAt),
      formatDateTimeRome(u.updatedAt),
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

/** Short Italian body, no PII (the personal data is in the CSV attachment). */
export function buildSuspendedUsersEmailBody(total: number, now: Date): string {
  return [
    "Gentile team,",
    "",
    `in allegato l'elenco degli utenti che hanno richiesto la limitazione del trattamento (sospensione), aggiornato al ${formatDateTimeRome(now)} (Europe/Rome). Utenti totali: ${total}.`,
    "",
    "L'elenco è ordinato dalla sospensione più recente alla meno recente.",
  ].join("\n");
}

/** `gg/mm/aaaa hh:mm` in Europe/Rome. */
export function formatDateTimeRome(date: Date): string {
  const p = romeDateParts(date);
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}

/** `gg/mm/aaaa` from an ISO date string (`YYYY-MM-DD`), no timezone shift. */
export function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

/** `aaaa-mm-gg` in Europe/Rome, for the attachment filename. */
export function romeDateStamp(date: Date): string {
  const p = romeDateParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

// Quote/escape per RFC 4180; the separator is ';' for Excel-IT compatibility.
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
  const parts = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Rome",
    year: "numeric",
  }).formatToParts(date);
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

function suspensionReasonLabel(reason: SuspensionReason): string {
  return match(reason)
    .with(
      SuspensionReason.enum.AccuracyContested,
      () => "Esattezza dei dati contestata",
    )
    .with(
      SuspensionReason.enum.UnlawfulProcessing,
      () => "Trattamento illecito",
    )
    .with(
      SuspensionReason.enum.DataNeededForLegalClaims,
      () =>
        "Dati necessari per accertamento/esercizio/difesa di un diritto in giudizio",
    )
    .with(
      SuspensionReason.enum.PendingObjectionVerification,
      () => "Verifica dell'opposizione in corso",
    )
    .exhaustive();
}
