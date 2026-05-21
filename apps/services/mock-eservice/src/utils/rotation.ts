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
