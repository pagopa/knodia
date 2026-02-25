import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { Agreement, AgreementState } from "@knodia/agreement-models";
import { type AgreementId, unsafeBrandId } from "@knodia/common-models/ids";
import {
  aggregateByPKString,
  throwIfMultipleOrEmpty,
} from "@knodia/db-readmodel-commons/utils";

import {
  type AgreementItemsSQL,
  type AgreementRequiredAttributeSQL,
  type AgreementSQL,
  readmodelAgreement,
  readmodelAgreementRequiredAttribute,
} from "../agreement.ts";
import { toGroupedRequiredAttributes } from "./converters.ts";

type AgreementAggregatorInput = {
  agreement: AgreementSQL;
  requiredAttribute?: AgreementRequiredAttributeSQL | null;
}[];

const buildAgreement = ({
  agreementSQL,
  requiredAttributesSQL,
}: AgreementItemsSQL): WithMetadata<Agreement> => {
  const requiredAttributesSQLByAgreementId = requiredAttributesSQL.reduce(
    (acc, a) => {
      const attributes = acc.get(a.agreementId) || [];
      attributes.push(a);
      acc.set(a.agreementId, attributes);
      return acc;
    },
    new Map<string, AgreementRequiredAttributeSQL[]>(),
  );

  const agreement: Agreement = {
    consumerId: unsafeBrandId(agreementSQL.consumerId),
    createdAt: new Date(agreementSQL.createdAt),
    eserviceId: unsafeBrandId(agreementSQL.eserviceId),
    eserviceVersionId: unsafeBrandId(agreementSQL.eserviceVersionId),
    id: unsafeBrandId(agreementSQL.id),
    producerId: unsafeBrandId(agreementSQL.producerId),
    requiredAttributes: toGroupedRequiredAttributes(
      requiredAttributesSQLByAgreementId.get(agreementSQL.id) || [],
    ),
    state: AgreementState.parse(agreementSQL.state),
    updatedAt: new Date(agreementSQL.updatedAt),
  };
  return {
    data: agreement,
    metadata: { version: agreementSQL.metadataVersion },
  };
};

export const aggregateAgreement = (
  queryRes: AgreementAggregatorInput,
): undefined | WithMetadata<Agreement> => {
  if (queryRes.length === 0) {
    return undefined;
  }

  const aggregatedAgreement = toAgreementAggregator(queryRes);

  return buildAgreement({
    agreementSQL: aggregatedAgreement.agreementSQL,
    requiredAttributesSQL: aggregatedAgreement.requiredAttributesSQL,
  });
};

export const aggregateAgreements = (
  queryRes: AgreementAggregatorInput,
): WithMetadata<Agreement>[] => {
  const { agreementsSQL, requiredAttributesSQL } =
    toAgreementsAggregator(queryRes);

  const requiredAttributesSQLByAgreementId = createAgreementSQLPropertyMap(
    requiredAttributesSQL,
  );

  return agreementsSQL.map((agreementSQL) => {
    const agreementId = unsafeBrandId<AgreementId>(agreementSQL.id);
    return buildAgreement({
      agreementSQL,
      requiredAttributesSQL:
        requiredAttributesSQLByAgreementId.get(agreementId) || [],
    });
  });
};

const createAgreementSQLPropertyMap = <T extends AgreementRequiredAttributeSQL>(
  items: T[],
): Map<AgreementId, T[]> =>
  items.reduce((acc, item) => {
    const agreementId = unsafeBrandId<AgreementId>(item.agreementId);
    const values = acc.get(agreementId) || [];
    values.push(item);
    acc.set(agreementId, values);

    return acc;
  }, new Map<AgreementId, T[]>());

const toAgreementAggregator = (
  queryRes: AgreementAggregatorInput,
): AgreementItemsSQL => {
  const { agreementsSQL, requiredAttributesSQL } =
    toAgreementsAggregator(queryRes);

  const agreementSQL = throwIfMultipleOrEmpty(agreementsSQL, "agreement");

  return {
    agreementSQL,
    requiredAttributesSQL,
  };
};

const toAgreementsAggregator = (
  queryRes: AgreementAggregatorInput,
): {
  agreementsSQL: AgreementSQL[];
  requiredAttributesSQL: AgreementRequiredAttributeSQL[];
} => {
  const agreementPKSet = new Set<string>();
  const agreementsSQL: AgreementSQL[] = [];

  const requiredAttributePKSet = new Set<string>();
  const requiredAttributesSQL: AgreementRequiredAttributeSQL[] = [];

  queryRes.forEach((row) => {
    aggregateByPKString(
      row.agreement,
      agreementPKSet,
      agreementsSQL,
      readmodelAgreement,
    );
    aggregateByPKString(
      row.requiredAttribute ?? null,
      requiredAttributePKSet,
      requiredAttributesSQL,
      readmodelAgreementRequiredAttribute,
    );
  });

  return {
    agreementsSQL,
    requiredAttributesSQL,
  };
};
