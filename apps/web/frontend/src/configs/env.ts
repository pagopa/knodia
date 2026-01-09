import { z } from "zod";

const EnvSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1, "VITE_API_BASE_URL is required"),
});

const parsed = EnvSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables",
    z.treeifyError(parsed.error).properties,
  );
  throw new Error("Invalid environment variables");
}

export const ENV = parsed.data;
