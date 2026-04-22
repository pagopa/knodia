import z from "zod";

export const Algorithm = z.enum(["RS256", "ES256"]);
export type Algorithm = z.infer<typeof Algorithm>;
