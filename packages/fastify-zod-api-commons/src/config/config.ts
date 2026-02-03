import z from "zod";

export const HTTPServerConfig = z
  .object({
    HOST: z
      .string()
      .min(1)
      .transform((s) => s.replace(/\/+$/, ""))
      .default("0.0.0.0"),
    PORT: z.coerce.number().int().min(1024).max(65535),
  })
  .transform((c) => ({
    host: c.HOST,
    port: c.PORT,
  }));
export type HTTPServerConfig = z.infer<typeof HTTPServerConfig>;
