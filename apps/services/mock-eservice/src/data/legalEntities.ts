import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import z from "zod";

import {
  API_CompanyUid,
  API_Evidence,
  type API_EvidenceType,
  API_LegalEntity,
} from "../models/api.ts";

const VAT_SCHEME = {
  schemeName: "Partita Iva",
  schemeURI: "http://memberstate.ms/VAT",
} as const;

const LegalEntityRow = API_LegalEntity.omit({ legalIdentifier: true });
const EvidenceRow = API_Evidence.omit({ isAbout: true });

const LegalEntitiesFile = z.record(API_CompanyUid, LegalEntityRow);
const EvidencesFile = z.record(API_CompanyUid, z.array(EvidenceRow));

const dataDir = dirname(fileURLToPath(import.meta.url));
const readJson = <T>(file: string, schema: z.ZodType<T>): T =>
  schema.parse(JSON.parse(readFileSync(join(dataDir, file), "utf8")));

const LEGAL_ENTITIES = readJson("legalEntities.json", LegalEntitiesFile);
const EVIDENCES = readJson("evidences.json", EvidencesFile);

// undefined = unknown company; empty array = known company, no evidence of that type.
export function findEvidences(
  uid: API_CompanyUid,
  evidenceType?: API_EvidenceType,
): API_Evidence[] | undefined {
  const legalEntity = findLegalEntity(uid);
  if (!legalEntity) {
    return undefined;
  }

  return (EVIDENCES[uid] ?? [])
    .filter(
      (evidence) =>
        !evidenceType ||
        evidence.isConformantTo.evidenceTypeClassification === evidenceType,
    )
    .map((evidence) => ({ ...evidence, isAbout: legalEntity }));
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
