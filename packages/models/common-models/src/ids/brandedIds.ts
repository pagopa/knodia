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

export function generateId<T extends IDS>(): T {
  return crypto.randomUUID() as T;
}

export function unsafeBrandId<T extends IDS>(id: string): T {
  return z.uuid().parse(id) as T;
}
