import { z } from "zod";

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
  .pipe(z.record(KnodeId, z.url()));
export type TargetKnodeUrls = z.infer<typeof TargetKnodeUrls>;
