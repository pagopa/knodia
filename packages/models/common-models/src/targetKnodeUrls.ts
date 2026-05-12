import { z } from "zod";

import { InternalError } from "./errors.ts";
import { KnodeId } from "./ids/ids.ts";

export const TargetKnodeUrls = z
  .string()
  .transform((raw, ctx) => {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "TARGET_KNODE_URLS must be a valid JSON string",
      });
      return z.NEVER;
    }
  })
  .pipe(z.partialRecord(KnodeId, z.url()));
export type TargetKnodeUrls = z.infer<typeof TargetKnodeUrls>;

type TargetKnodeUrlsErrorCode = "TARGET_KNODE_NOT_CONFIGURED";

export function getTargetKnodeUrl(
  targetKnodeUrls: TargetKnodeUrls,
  targetKnodeId: KnodeId,
): string {
  const url = targetKnodeUrls[targetKnodeId];
  if (!url) {
    throw targetKnodeNotConfiguredError(targetKnodeId);
  }
  return url;
}

function targetKnodeNotConfiguredError(
  targetKnodeId: KnodeId,
): InternalError<TargetKnodeUrlsErrorCode> {
  return new InternalError({
    code: "TARGET_KNODE_NOT_CONFIGURED",
    detail: `No URL configured for target knode "${targetKnodeId}"`,
  });
}
