import z from "zod";

export const HTTPServerConfig = z
  .object({
    HOST: z
      .string()
      .min(1)
      .transform((s) => s.replace(/\/+$/, ""))
      .default("0.0.0.0"),
    PORT: z.coerce.number().int().min(1024).max(65535),
    SERVICE_NAME: z.string(),
  })
  .transform((c) => ({
    host: c.HOST,
    port: c.PORT,
    serviceName: c.SERVICE_NAME,
  }));
export type HTTPServerConfig = z.infer<typeof HTTPServerConfig>;
