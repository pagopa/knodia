import { z } from "zod";

export const SignalType = z.enum(["Create", "Update", "Delete", "SeedUpdate"]);
export type SignalType = z.infer<typeof SignalType>;
