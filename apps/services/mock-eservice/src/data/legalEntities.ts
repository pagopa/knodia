import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import z from "zod";

import {
  API_CompanyUid,
  API_Evidence,
  type API_EvidenceType,
  API_LegalEntity,
  type API_PeriodOfTime,
} from "../models/api.ts";
import { legalEntityActivities } from "../models/legalEntityActivities.ts";

const VAT_SCHEME = {
  schemeName: "Partita Iva",
  schemeURI: "http://memberstate.ms/VAT",
} as const;

// The API models legalEntityActivity as a plain string; here we additionally
// validate it against the known ATECO 2025 codes when loading the dataset.
const LegalEntityActivityCode = z.enum(
  Object.keys(legalEntityActivities) as [string, ...string[]],
);
const LegalEntityRow = API_LegalEntity.omit({ legalIdentifier: true }).extend({
  legalEntityActivity: LegalEntityActivityCode,
});
const EvidenceRow = API_Evidence.omit({ isAbout: true });

const LegalEntitiesFile = z.record(API_CompanyUid, LegalEntityRow);
const EvidencesFile = z.record(API_CompanyUid, z.array(EvidenceRow));

const dataDir = dirname(fileURLToPath(import.meta.url));
const readJson = <T>(file: string, schema: z.ZodType<T>): T =>
  schema.parse(JSON.parse(readFileSync(join(dataDir, file), "utf8")));

const LEGAL_ENTITIES = readJson("legalEntities.json", LegalEntitiesFile);
const EVIDENCES = readJson("evidences.json", EvidencesFile);

// Demo-only: the evidence-update route bumps a per-company revision that
// findEvidences turns into an extended validity end year, so the recover step
// sees a changed evidence. In-memory, resets on restart.
const evidenceRevisions = new Map<API_CompanyUid, number>();

export function bumpEvidenceRevision(uid: API_CompanyUid): number {
  const next = (evidenceRevisions.get(uid) ?? 0) + 1;
  evidenceRevisions.set(uid, next);
  return next;
}

// undefined = unknown company; empty array = known company, no evidence of that type.
export function findEvidences(
  uid: API_CompanyUid,
  evidenceType?: API_EvidenceType,
): API_Evidence[] | undefined {
  const legalEntity = findLegalEntity(uid);
  if (!legalEntity) {
    return undefined;
  }

  const revision = evidenceRevisions.get(uid) ?? 0;
  return (EVIDENCES[uid] ?? [])
    .filter(
      (evidence) =>
        !evidenceType ||
        evidence.isConformantTo.evidenceTypeClassification === evidenceType,
    )
    .map((evidence) => ({
      ...evidence,
      isAbout: legalEntity,
      validityPeriod: revisedValidity(evidence.validityPeriod, revision),
    }));
}

export function findLegalEntity(
  uid: API_CompanyUid,
): API_LegalEntity | undefined {
  const row = LEGAL_ENTITIES[uid];
  if (!row) {
    return undefined;
  }
  return { ...row, legalIdentifier: { ...VAT_SCHEME, notation: uid } };
}

export function resetEvidenceRevisions(): void {
  evidenceRevisions.clear();
}

function revisedValidity(
  period: API_PeriodOfTime,
  revision: number,
): API_PeriodOfTime {
  if (!revision || !period.endtime) {
    return period;
  }
  const [year, month, day] = period.endtime.split("-");
  return { ...period, endtime: `${Number(year) + revision}-${month}-${day}` };
}
