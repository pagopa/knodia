import z from "zod";

const BffProcessConfig = z
  .object({
    ESERVICE_PROCESS_URL: z.url(),
  })
  .transform((c) => ({
    eserviceProcessUrl: c.ESERVICE_PROCESS_URL,
  }));
type BffProcessConfig = z.infer<typeof BffProcessConfig>;
export const config = BffProcessConfig.parse(process.env);
