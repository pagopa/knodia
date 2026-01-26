import { z } from "zod";

const FrontendNode1Config = z
  .object({
    VITE_BFF_URL: z.string().min(1, "VITE_BFF_URL is required"),
  })
  .transform((c) => ({
    bffUrl: c.VITE_BFF_URL,
  }));

const parsed = FrontendNode1Config.safeParse(import.meta.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables",
    z.treeifyError(parsed.error).properties,
  );
  throw new Error("Invalid environment variables");
}

type FrontendNode1Config = z.infer<typeof FrontendNode1Config>;
export const config = parsed.data;
