import { z } from "zod";

export const Eservice = z.strictObject({
  id: z.string(),
});
export type Eservice = z.infer<typeof Eservice>;
