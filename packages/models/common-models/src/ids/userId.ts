import z from "zod";

// UserId uses guid() instead of uuid() because Cognito user pool subs
// don't conform to RFC 4122 variant bits. guid() validates the hex format
// without enforcing variant/version. toLowerCase() normalizes case for
// consistent storage and comparison.
export const UserId = z.guid().toLowerCase().brand<"UserId">();
export type UserId = z.infer<typeof UserId>;

export function generateUserId(): UserId {
  return crypto.randomUUID() as UserId;
}

export function unsafeBrandUserId(id: string): UserId {
  return UserId.parse(id);
}
