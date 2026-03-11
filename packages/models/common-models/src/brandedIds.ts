import z from "zod";

export const ExternalId = <T extends IDS>() =>
  z
    .uuid()
    .brand<`ExternalId:${T extends string & z.core.$brand<infer B> ? B : never}`>();
export type ExternalId<T extends IDS> = z.infer<
  ReturnType<typeof ExternalId<T>>
>;

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

export const UserId = z.uuid().brand<"UserId">();
export type UserId = z.infer<typeof UserId>;

export const KnodeId = z.enum(["Orion", "Lynx"]).brand<"KnodeId">();
export type KnodeId = z.infer<typeof KnodeId>;

export const AgreementId = z.uuid().brand<"AgreementId">();
export type AgreementId = z.infer<typeof AgreementId>;

export const ConsumerKeychainId = z.uuid().brand<"ConsumerKeychainId">();
export type ConsumerKeychainId = z.infer<typeof ConsumerKeychainId>;

export const PurposeId = z.uuid().brand<"PurposeId">();
export type IDS =
  | AgreementId
  | ConsumerKeychainId
  | CorrelationId
  | EserviceId
  | EserviceInterfaceId
  | EserviceVersionId
  | KnodeId
  | OrganizationId
  | PurposeId
  | UserId;

export type PurposeId = z.infer<typeof PurposeId>;

export function generateExternalId<T extends IDS>(): ExternalId<T> {
  return crypto.randomUUID() as ExternalId<T>;
}

export function generateId<T extends IDS>(): T {
  return crypto.randomUUID() as T;
}

export function unsafeBrandExternalId<T extends IDS>(
  id: string,
): ExternalId<T> {
  return z.uuid().parse(id) as ExternalId<T>;
}

export function unsafeBrandId<T extends IDS>(id: string): T {
  return z.uuid().parse(id) as T;
}
