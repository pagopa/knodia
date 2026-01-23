import z from "zod";

export const EserviceId = z.uuid().brand<"EserviceId">();
export type EserviceId = z.infer<typeof EserviceId>;

export const EserviceVersionId = z.string().brand<"EserviceVersionId">();
export type EserviceVersionId = z.infer<typeof EserviceVersionId>;

export const EserviceInterfaceId = z.string().brand<"EserviceInterfaceId">();
export type EserviceInterfaceId = z.infer<typeof EserviceInterfaceId>;

export const OrganizationId = z.string().brand<"OrganizationId">();
export type OrganizationId = z.infer<typeof OrganizationId>;

export const AttributeId = z.string().brand<"AttributeId">();
export type AttributeId = z.infer<typeof AttributeId>;

type IDS =
  | AttributeId
  | EserviceId
  | EserviceInterfaceId
  | EserviceVersionId
  | OrganizationId;

export function generateId<T extends IDS>(): T {
  return crypto.randomUUID() as T;
}
