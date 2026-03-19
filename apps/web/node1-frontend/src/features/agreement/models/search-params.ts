import { KnodeId } from "@knodia/common-models/ids";
import { z } from "zod";

export const producerAgreementSearchDefaultValues = {
  offset: 0,
} as const;

export const producerAgreementSearchSchema = z.object({
  offset: z
    .number()
    .min(0)
    .default(producerAgreementSearchDefaultValues.offset)
    .catch(producerAgreementSearchDefaultValues.offset),
});

export const requestAgreementSearchSchema = z.object({
  eserviceId: z.string(),
  knodeId: KnodeId,
});
