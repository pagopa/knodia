import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import z from "zod";

import {
  type API_ISCEDFCode,
  API_Qualification,
  API_Student,
  API_StudentUid,
} from "../models/api.ts";

// Receive-data registrations mutate this in-memory store (reset on restart), so
// a getQualifications after setQualification reflects the just-added record.

const STUDENT_UID_SCHEME = {
  schemeName: "Matricola Studente",
  schemeURI: "http://studentRegistryLynx/UIDStudent",
} as const;

const StudentRow = API_Student.omit({ uidStudent: true });

const StudentsFile = z.record(API_StudentUid, StudentRow);
const QualificationsFile = z.record(API_StudentUid, z.array(API_Qualification));

const dataDir = dirname(fileURLToPath(import.meta.url));
const readJson = <T>(file: string, schema: z.ZodType<T>): T =>
  schema.parse(JSON.parse(readFileSync(join(dataDir, file), "utf8")));

const STUDENTS = readJson("students.json", StudentsFile);
const QUALIFICATIONS = readJson("qualifications.json", QualificationsFile);

export function addQualification(
  uid: API_StudentUid,
  qualification: API_Qualification,
): boolean {
  if (!findStudent(uid)) {
    return false;
  }
  (QUALIFICATIONS[uid] ??= []).push(qualification);
  return true;
}

// undefined = unknown student; empty array = known student, no qualification in
// that ISCED-F field.
export function findQualifications(
  uid: API_StudentUid,
  iscedfCode?: API_ISCEDFCode,
): API_Qualification[] | undefined {
  if (!findStudent(uid)) {
    return undefined;
  }
  return (QUALIFICATIONS[uid] ?? []).filter(
    (qualification) =>
      !iscedfCode || qualification.ISCEDFCode.includes(iscedfCode),
  );
}

function findStudent(uid: API_StudentUid): API_Student | undefined {
  const row = STUDENTS[uid];
  if (!row) {
    return undefined;
  }
  return { ...row, uidStudent: { ...STUDENT_UID_SCHEME, notation: uid } };
}
