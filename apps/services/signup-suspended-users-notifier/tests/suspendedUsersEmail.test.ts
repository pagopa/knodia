import { generateId, type SignupUserId } from "@knodia/common-models/ids";
import {
  type SignupUser,
  SignupUserStatus,
  SuspensionReason,
} from "@knodia/signup-models";
import { describe, expect, it } from "vitest";

import {
  buildSuspendedUsersCsv,
  buildSuspendedUsersEmailBody,
  formatDate,
  formatDateTime,
} from "../src/services/suspendedUsersEmail.ts";

type SuspendedSignupUser = Extract<SignupUser, { status: "Suspended" }>;

const HEADER =
  "ID utente;Nome;Cognome;Email;Data di nascita;Codice fiscale;Identificativo persona;Codice SPID;Sospeso il;Motivo;Motivo (codice);Creato il;Aggiornato il;Organizzazione Lynx;Utente Lynx;Organizzazione Orion;Utente Orion";

function csvLines(csv: string): string[] {
  return csv
    .replace(/^\uFEFF/, "")
    .trimEnd()
    .split("\r\n");
}

function makeSuspended(
  overrides: Partial<SuspendedSignupUser> = {},
): SuspendedSignupUser {
  const id = generateId<SignupUserId>();
  return {
    createdAt: new Date("2026-01-10T08:30:00Z"),
    dateOfBirth: "1980-01-15",
    email: `${id}@example.test`,
    familyName: "Rossi",
    fiscalNumber: "RSSMRA80A15H501U",
    generatedEntities: {
      Lynx: { organizationName: "Lynx Org", userName: "lynx_user" },
      Orion: { organizationName: "Orion Org", userName: "orion_user" },
    },
    name: "Mario",
    signupUserId: id,
    status: SignupUserStatus.enum.Suspended,
    suspendedAt: new Date("2026-03-01T10:00:00Z"),
    suspensionReason: SuspensionReason.enum.AccuracyContested,
    updatedAt: new Date("2026-03-01T10:00:00Z"),
    ...overrides,
  };
}

// RFC 4180 line parser (";" delimiter): treats ";" / "" inside quotes literally.
function parseCsvRow(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ";") {
      fields.push(field);
      field = "";
    } else {
      field += char;
    }
  }
  fields.push(field);
  return fields;
}

describe("buildSuspendedUsersCsv", () => {
  it("starts with a UTF-8 BOM and a ;-separated Italian header", () => {
    const csv = buildSuspendedUsersCsv([makeSuspended()]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csvLines(csv)[0]).toBe(HEADER);
  });

  it("preserves the given order (most-recent-first is the caller's job)", () => {
    const a = makeSuspended({ name: "Aaa" });
    const b = makeSuspended({ name: "Bbb" });
    const rows = csvLines(buildSuspendedUsersCsv([a, b])).slice(1);
    expect(rows[0]?.startsWith(`${a.signupUserId};Aaa;`)).toBe(true);
    expect(rows[1]?.startsWith(`${b.signupUserId};Bbb;`)).toBe(true);
  });

  it.each([
    {
      idColumns: ["RSSMRA80A15H501U", "", ""],
      label: "fiscalNumber",
      user: { fiscalNumber: "RSSMRA80A15H501U" },
    },
    {
      idColumns: ["", "EU-PID-123", ""],
      label: "personIdentifier",
      user: {
        fiscalNumber: undefined,
        personIdentifier: "EU-PID-123",
      },
    },
    {
      idColumns: ["", "", "SPID-XYZ-1"],
      label: "spidCode",
      user: { fiscalNumber: undefined, spidCode: "SPID-XYZ-1" },
    },
  ])("renders only the $label identifier column", ({ idColumns, user }) => {
    const csv = buildSuspendedUsersCsv([makeSuspended(user)]);
    const cells = csvLines(csv)[1]?.split(";") ?? [];
    // columns 5,6,7 = Codice fiscale, Identificativo persona, Codice SPID
    expect([cells[5], cells[6], cells[7]]).toEqual(idColumns);
  });

  it("renders the suspension reason as Italian label + raw enum code", () => {
    const csv = buildSuspendedUsersCsv([
      makeSuspended({
        suspensionReason: SuspensionReason.enum.UnlawfulProcessing,
      }),
    ]);
    const cells = csvLines(csv)[1]?.split(";") ?? [];
    expect(cells[9]).toBe("Trattamento illecito (Art. 18.1.(b) GDPR)");
    expect(cells[10]).toBe("UnlawfulProcessing");
  });

  it("keeps the row intact when a field contains the separator or quotes", () => {
    const csv = buildSuspendedUsersCsv([
      makeSuspended({ familyName: 'Ro;ss"i' }),
    ]);
    const lines = csvLines(csv);
    // The ";" and '"' live inside a quoted field, so the row still parses to the
    // same column count as the header, with the value recovered intact.
    const headerCells = parseCsvRow(lines[0] ?? "");
    const dataCells = parseCsvRow(lines[1] ?? "");
    expect(dataCells).toHaveLength(headerCells.length);
    expect(dataCells[2]).toBe('Ro;ss"i');
  });
});

describe("buildSuspendedUsersEmailBody", () => {
  it("includes the count and date but no PII", () => {
    const body = buildSuspendedUsersEmailBody(
      3,
      new Date("2026-06-25T06:00:00Z"),
    );
    expect(body).toContain("Knodia");
    expect(body).toContain("Utenti totali: 3");
    expect(body).toContain("25/06/2026");
    expect(body).not.toContain("@example.test");
  });
});

describe("formatDateTime / formatDate", () => {
  it("renders timestamps in Europe/Rome, honoring DST", () => {
    // Winter: +01:00 → 13:00; Summer: +02:00 → 14:00
    expect(formatDateTime(new Date("2026-01-15T12:00:00Z"))).toBe(
      "15/01/2026 13:00",
    );
    expect(formatDateTime(new Date("2026-07-15T12:00:00Z"))).toBe(
      "15/07/2026 14:00",
    );
  });

  it("renders a calendar date as gg/mm/aaaa without timezone shift", () => {
    expect(formatDate("1980-01-15")).toBe("15/01/1980");
  });
});
