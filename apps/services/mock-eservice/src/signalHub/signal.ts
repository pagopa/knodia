import { z } from "zod";

// TODO: switch to `@knodia/signal-hub-models` once PR #472 lands. That
// package defines `SignalType` with PascalCase values
// (`"Create" | "Update" | "Delete" | "SeedUpdate"`); the migration needs
// to reconcile the casing across producer + consumer.
export const SignalType = z.enum(["CREATE", "DELETE", "SEEDUPDATE", "UPDATE"]);
export type SignalType = z.infer<typeof SignalType>;
