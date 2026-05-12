import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import {
  toExternalResource,
  toOptionalExternalResource,
} from "@knodia/common-models/externalResource";
import {
  type OrganizationId,
  type PurposeTemplateId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { LocalizedText } from "@knodia/common-models/localization";
import {
  aggregateByPKString,
  throwIfMultipleOrEmpty,
} from "@knodia/db-readmodel-commons/utils";
import {
  maxDescriptionLength,
  maxNameLength,
  minDescriptionLength,
  minNameLength,
  type Purpose,
  PurposeFormAnswers,
  PurposeFormSchemaVersion,
  PurposeState,
} from "@knodia/purpose-models";

import { type PurposeSQL, readmodelPurpose } from "../purpose.ts";

type PurposeAggregatorInput = {
  purpose: PurposeSQL;
}[];

const LocalizedName = LocalizedText(minNameLength, maxNameLength);
const LocalizedDescription = LocalizedText(
  minDescriptionLength,
  maxDescriptionLength,
);

const buildPurpose = (purposeSQL: PurposeSQL): WithMetadata<Purpose> => {
  const purpose: Purpose = {
    consumer: toExternalResource<OrganizationId>(
      purposeSQL.consumerId,
      purposeSQL.consumerKnodeId,
    ),
    createdAt: purposeSQL.createdAt,
    dailyCalls: purposeSQL.dailyCalls,
    description: LocalizedDescription.parse(purposeSQL.description),
    eserviceId: unsafeBrandId(purposeSQL.eserviceId),
    formAnswersJson: PurposeFormAnswers.parse(purposeSQL.formAnswersJson),
    formSchemaVersion: PurposeFormSchemaVersion.parse(
      purposeSQL.formSchemaVersion,
    ),
    id: unsafeBrandId(purposeSQL.id),
    name: LocalizedName.parse(purposeSQL.name),
    state: PurposeState.parse(purposeSQL.state),
    suspendedByConsumerAt: purposeSQL.suspendedByConsumerAt,
    suspendedByProducerAt: purposeSQL.suspendedByProducerAt,
    template: toOptionalExternalResource<PurposeTemplateId>(
      purposeSQL.templateId,
      purposeSQL.templateKnodeId,
    ),
    updatedAt: purposeSQL.updatedAt,
  };
  return {
    data: purpose,
    metadata: { version: purposeSQL.metadataVersion },
  };
};

export const aggregatePurposes = (
  queryRes: PurposeAggregatorInput,
): WithMetadata<Purpose>[] => {
  const purposesSQL = toPurposesAggregator(queryRes);

  return purposesSQL.map(buildPurpose);
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

  return throwIfMultipleOrEmpty(purposesSQL, "purpose", (p) => p.id);
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
