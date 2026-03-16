import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { Purpose } from "@knodia/purpose-models";

import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import { KnodeId, unsafeBrandId } from "@knodia/common-models/ids";

import type { PurposeSQL } from "../purpose.ts";

export const toPurpose = (purposeSQL: PurposeSQL): WithMetadata<Purpose> => {
  const purpose: Purpose = {
    consumer: {
      id: unsafeBrandExternalId(purposeSQL.consumerId),
      knodeId: KnodeId.parse(purposeSQL.consumerKnodeId),
    },
    createdAt: purposeSQL.createdAt,
    dailyCalls: purposeSQL.dailyCalls,
    description: purposeSQL.description,
    eserviceId: unsafeBrandId(purposeSQL.eserviceId),
    formAnswers: purposeSQL.formAnswers,
    id: unsafeBrandId(purposeSQL.id),
    name: purposeSQL.name,
    state: purposeSQL.state as Purpose["state"],
    updatedAt: purposeSQL.updatedAt,
  };
  return {
    data: purpose,
    metadata: { version: purposeSQL.metadataVersion },
  };
};
