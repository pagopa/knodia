import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { Purpose } from "@knodia/purpose-models";

import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import { KnodeId, unsafeBrandId } from "@knodia/common-models/ids";
import {
  aggregateByPKString,
  throwIfMultipleOrEmpty,
} from "@knodia/db-readmodel-commons/utils";

import { type PurposeSQL, readmodelPurpose } from "../purpose.ts";

type PurposeAggregatorInput = {
  purpose: PurposeSQL;
}[];

const buildPurpose = (purposeSQL: PurposeSQL): WithMetadata<Purpose> => {
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

export const aggregatePurpose = (
  queryRes: PurposeAggregatorInput,
): undefined | WithMetadata<Purpose> => {
  if (queryRes.length === 0) {
    return undefined;
  }

  return buildPurpose(toPurposeAggregator(queryRes));
};

const toPurposeAggregator = (queryRes: PurposeAggregatorInput): PurposeSQL => {
  const purposesSQL = toPurposesAggregator(queryRes);

  return throwIfMultipleOrEmpty(purposesSQL, "purpose");
};

const toPurposesAggregator = (
  queryRes: PurposeAggregatorInput,
): PurposeSQL[] => {
  const purposePKSet = new Set<string>();
  const purposesSQL: PurposeSQL[] = [];

  queryRes.forEach((row) => {
    aggregateByPKString(
      row.purpose,
      purposePKSet,
      purposesSQL,
      readmodelPurpose,
    );
  });

  return purposesSQL;
};
