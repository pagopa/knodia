import z from "zod";

export const UserRole = z.enum(["administrative", "technical"]);
export type UserRole = z.infer<typeof UserRole>;
