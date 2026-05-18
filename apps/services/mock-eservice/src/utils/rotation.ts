import { type EserviceId } from "@knodia/common-models/ids";
import { createHmac } from "node:crypto";

export function computePeriodId(
  now: number,
  startDateMs: number,
  seedExpireSeconds: number,
): number {
  const elapsedMs = now - startDateMs;
  const periodMs = seedExpireSeconds * 1000;
  return Math.floor(elapsedMs / periodMs);
}

export function getRotatedSeed(
  eserviceId: EserviceId,
  periodId: number,
  { algorithm, saltLength }: { algorithm: string; saltLength: number },
): string {
  return createHmac(algorithm, eserviceId)
    .update(periodId.toString())
    .digest("hex")
    .substring(0, saltLength);
}
