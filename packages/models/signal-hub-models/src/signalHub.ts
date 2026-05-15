import { z } from "zod";

const SignalType = z.enum(["CREATE", "UPDATE", "DELETE", "SEEDUPDATE"]);
export type SignalType = z.infer<typeof SignalType>;
