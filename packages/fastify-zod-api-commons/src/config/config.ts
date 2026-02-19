import z from "zod";

export const AuthConfig = z
  .object({
    ACCEPTED_AUDIENCES: z.string().min(1),
    WELL_KNOWN_URLS: z.string().min(1),
  })
  .transform((c) => ({
    acceptedAudiences: c.ACCEPTED_AUDIENCES.split(",").map((a) => a.trim()),
    wellKnownUrls: c.WELL_KNOWN_URLS.split(",").map((u) => u.trim()),
  }));
export type AuthConfig = z.infer<typeof AuthConfig>;

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
