import { API_AgreementConsumer } from "@knodia/agreement-models/api";
import { z } from "zod";

export const API_AgreementSeed = z
  .strictObject({
    consumer: API_AgreementConsumer,
    eserviceId: z.uuid(),
    eserviceVersionId: z.uuid(),
  })
  .meta({ id: "AgreementSeed" });
export type API_AgreementSeed = z.infer<typeof API_AgreementSeed>;
