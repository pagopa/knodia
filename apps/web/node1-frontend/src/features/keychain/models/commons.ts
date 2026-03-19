import z from "zod";

export const keychainType = z.enum(["production", "consumption", "api"]);
export type KeychainType = z.infer<typeof keychainType>;
