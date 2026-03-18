import type { Purpose } from "@knodia/purpose-models";

import type { PurposeSQL } from "../purpose.ts";

export const toPurposeSQL = (
  purpose: Purpose,
  metadataVersion: number,
): PurposeSQL => ({
  consumerId: purpose.consumer.id,
  consumerKnodeId: purpose.consumer.knodeId,
  createdAt: purpose.createdAt,
  dailyCalls: purpose.dailyCalls,
  description: purpose.description,
  eserviceId: purpose.eserviceId,
  formAnswersJson: purpose.formAnswersJson,
  id: purpose.id,
  metadataVersion,
  name: purpose.name,
  state: purpose.state,
  updatedAt: purpose.updatedAt,
});
