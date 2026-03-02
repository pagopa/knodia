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

export const KnodeId = z.enum(["Orion", "Lynx"]).brand<"KnodeId">();
export type KnodeId = z.infer<typeof KnodeId>;

export const AgreementId = z.uuid().brand<"AgreementId">();
export type AgreementId = z.infer<typeof AgreementId>;

export type IDS =
  | AgreementId
  | CorrelationId
  | EserviceId
  | EserviceInterfaceId
  | EserviceVersionId
  | KnodeId
  | OrganizationId
  | UserId;

export function generateId<T extends IDS>(): T {
  return crypto.randomUUID() as T;
}

export function unsafeBrandId<T extends IDS>(id: string): T {
  return z.uuid().parse(id) as T;
}
