import z from "zod";

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

export const KnodeId = z.uuid().brand<"KnodeId">();
export type KnodeId = z.infer<typeof KnodeId>;

export const KeychainId = z.uuid().brand<"KeychainId">();
export type KeychainId = z.infer<typeof KeychainId>;

export const PurposeId = z.uuid().brand<"PurposeId">();
export type PurposeId = z.infer<typeof PurposeId>;

type IDS =
  | CorrelationId
  | EserviceId
  | EserviceInterfaceId
  | EserviceVersionId
  | KeychainId
  | KnodeId
  | OrganizationId
  | PurposeId
  | UserId;

export function generateId<T extends IDS>(): T {
  return crypto.randomUUID() as T;
}

export function unsafeBrandId<T extends IDS>(id: string): T {
  return z.uuid().parse(id) as T;
}
