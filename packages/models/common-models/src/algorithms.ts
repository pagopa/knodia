import z from "zod";

export const Algorithm = z.enum(["RS256"]);
export type Algorithm = z.infer<typeof Algorithm>;
