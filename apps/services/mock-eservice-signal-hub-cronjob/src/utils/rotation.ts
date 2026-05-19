// Duplicated PDND-style from `apps/services/mock-eservice/src/utils/rotation.ts`.
// Any change to the formula or the SignalHubSeedConfig shape MUST be mirrored
// in both places — otherwise cron and producer drift and a consumer can no
// longer decode `objectId` against the seed it reads from /pseudonymization.

import { type EserviceId } from "@knodia/common-models/ids";
import { createHmac } from "node:crypto";

export interface SignalHubSeedConfig {
  expireSeconds: number;
  saltLength: number;
  startDateMs: number;
}

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

export function nextBoundaryMs(
  now: number,
  config: SignalHubSeedConfig,
): number {
  const periodId = computePeriodId(now, config);
  return config.startDateMs + (periodId + 1) * config.expireSeconds * 1000;
}
