import { z } from "zod";

import { KnodeId } from "./ids/ids.ts";

// Partial: each service maps only the knodes it needs (typically just the
// *other* knode in multinode, so accidentally calling oneself surfaces as
// an explicit missing-key error rather than silently looping through HTTP).
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

export const TargetKnodeUrlsConfig = z
  .object({
    TARGET_KNODE_URLS: TargetKnodeUrls,
  })
  .transform((c) => ({
    targetKnodeUrls: c.TARGET_KNODE_URLS,
  }));
export type TargetKnodeUrlsConfig = z.infer<typeof TargetKnodeUrlsConfig>;
