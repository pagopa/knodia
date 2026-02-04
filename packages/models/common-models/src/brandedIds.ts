import z from "zod";

export const EserviceId = z.uuid().brand<"EserviceId">();
export type EserviceId = z.infer<typeof EserviceId>;

export const EserviceVersionId = z.uuid().brand<"EserviceVersionId">();
export type EserviceVersionId = z.infer<typeof EserviceVersionId>;

export const EserviceInterfaceId = z.uuid().brand<"EserviceInterfaceId">();
export type EserviceInterfaceId = z.infer<typeof EserviceInterfaceId>;

export const OrganizationId = z.uuid().brand<"OrganizationId">();
export type OrganizationId = z.infer<typeof OrganizationId>;

type IDS =
  | EserviceId
  | EserviceInterfaceId
  | EserviceVersionId
  | OrganizationId;

export function generateId<T extends IDS>(): T {
  return crypto.randomUUID() as T;
}

export function unsafeBrandId<T extends IDS>(id: string): T {
  return z.uuid().parse(id) as T;
}
