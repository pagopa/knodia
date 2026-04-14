import z from "zod";

/**
 * Keys in keychains are identified by a base64 string of the their JWK representation.
 * This allows us to have a stable identifier for keys.
 */
export const KeyId = z.base64url().brand<"KeyId">();
export type KeyId = z.infer<typeof KeyId>;

export function unsafeBrandKeyId(id: string): KeyId {
  return KeyId.parse(id);
}
