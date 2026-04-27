import z from "zod";

export const Algorithm = z.enum(["RS256", "ES256"]);
export type Algorithm = z.infer<typeof Algorithm>;

export const PublicKeyJwkRS256 = z.strictObject({
  e: z.string(),
  kty: z.literal("RSA"),
  n: z.string(),
});

export const PublicKeyJwkES256 = z.strictObject({
  crv: z.literal("P-256"),
  kty: z.literal("EC"),
  x: z.string(),
  y: z.string(),
});

export const PublicKeyJwk = z.discriminatedUnion("kty", [
  PublicKeyJwkRS256,
  PublicKeyJwkES256,
]);
export type PublicKeyJwk = z.infer<typeof PublicKeyJwk>;
