import { type EserviceId } from "@knodia/common-models/ids";
import { createHmac } from "node:crypto";

export interface SignalHubSeedConfig {
  expireSeconds: number;
  saltLength: number;
  startDateMs: number;
}

// Exported for tests; treat as an internal helper of this module — callers
// outside (router, future cron) should go through `getRotatedSeed` /
// `findResidence`, which take `(now, config)` and compute the period themselves.
export function computePeriodId(
  now: number,
  {
    expireSeconds,
    startDateMs,
  }: Pick<SignalHubSeedConfig, "expireSeconds" | "startDateMs">,
): number {
  return Math.floor((now - startDateMs) / (expireSeconds * 1000));
}

export function getRotatedSeed(
  eserviceId: EserviceId,
  now: number,
  config: SignalHubSeedConfig,
): string {
  const periodId = computePeriodId(now, config);
  return createHmac("sha256", eserviceId)
    .update(periodId.toString())
    .digest("hex")
    .substring(0, config.saltLength);
}
