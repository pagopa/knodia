import z from "zod";

export type IDS =
  | AgreementId
  | ConsumerKeychainId
  | CorrelationId
  | EserviceId
  | EserviceInterfaceId
  | EserviceVersionId
  | OrganizationId
  | PurposeId;

export const CorrelationId = z.uuid().brand<"CorrelationId">();
export type CorrelationId = z.infer<typeof CorrelationId>;

export const EserviceId = z.uuid().brand<"EserviceId">();
export type EserviceId = z.infer<typeof EserviceId>;

export const EserviceVersionId = z.uuid().brand<"EserviceVersionId">();
export type EserviceVersionId = z.infer<typeof EserviceVersionId>;

export const EserviceInterfaceId = z.uuid().brand<"EserviceInterfaceId">();
export type EserviceInterfaceId = z.infer<typeof EserviceInterfaceId>;

export const OrganizationId = z.uuid().brand<"OrganizationId">();
export type OrganizationId = z.infer<typeof OrganizationId>;

export const AgreementId = z.uuid().brand<"AgreementId">();
export type AgreementId = z.infer<typeof AgreementId>;

export const ConsumerKeychainId = z.uuid().brand<"ConsumerKeychainId">();
export type ConsumerKeychainId = z.infer<typeof ConsumerKeychainId>;

export const PurposeId = z.uuid().brand<"PurposeId">();
export type PurposeId = z.infer<typeof PurposeId>;

// UserId uses guid() instead of uuid() because Cognito user pool subs
// don't conform to RFC 4122 variant bits. guid() validates the hex format
// without enforcing variant/version. toLowerCase() normalizes case for
// consistent storage and comparison.
export const UserId = z.guid().toLowerCase().brand<"UserId">();
export type UserId = z.infer<typeof UserId>;

export function generateId<T extends IDS>(): T {
  return crypto.randomUUID() as T;
}

export function generateUserId(): UserId {
  return crypto.randomUUID() as UserId;
}

export function unsafeBrandId<T extends IDS>(id: string): T {
  return z.uuid().parse(id) as T;
}

export function unsafeBrandUserId(id: string): UserId {
  return UserId.parse(id);
}
