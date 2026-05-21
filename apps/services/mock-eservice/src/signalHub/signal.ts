import { z } from "zod";

// TODO: replace with `@knodia/signal-hub-models` once PR #472 lands.
export const SignalType = z.enum(["Create", "Delete", "SeedUpdate", "Update"]);
export type SignalType = z.infer<typeof SignalType>;
