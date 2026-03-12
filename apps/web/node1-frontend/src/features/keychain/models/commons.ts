import z from "zod";

export const keychainType = z.enum(["consumer", "producer", "api"]);
export type KeychainType = z.infer<typeof keychainType>;
