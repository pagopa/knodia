import { EserviceId, KnodeId } from "@knodia/common-models/ids";
import { z } from "zod";

export const producerAgreementSearchDefaultValues = {
  eserviceId: undefined,
  offset: 0,
} as const;

export const producerAgreementSearchSchema = z.object({
  eserviceId: EserviceId.optional().catch(
    producerAgreementSearchDefaultValues.eserviceId,
  ),
  offset: z
    .number()
    .min(0)
    .default(producerAgreementSearchDefaultValues.offset)
    .catch(producerAgreementSearchDefaultValues.offset),
});

export type ProducerAgreementSearchParams = z.infer<
  typeof producerAgreementSearchSchema
>;

export const requestAgreementSearchSchema = z.object({
  eserviceId: z.string(),
  knodeId: KnodeId,
});
