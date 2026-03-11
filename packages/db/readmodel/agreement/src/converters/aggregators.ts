import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { Agreement, AgreementState } from "@knodia/agreement-models";
import {
  type AgreementId,
  KnodeId,
  unsafeBrandExternalId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import {
  aggregateByPKString,
  throwIfMultipleOrEmpty,
} from "@knodia/db-readmodel-commons/utils";

import {
  type AgreementAttributeSQL,
  type AgreementItemsSQL,
  type AgreementSQL,
  readmodelAgreement,
  readmodelAgreementAttribute,
} from "../agreement.ts";
import { toAgreementAttribute } from "./converters.ts";

type AgreementAggregatorInput = {
  agreement: AgreementSQL;
  attribute: AgreementAttributeSQL | null;
}[];

const buildAgreement = ({
  agreementSQL,
  attributesSQL,
}: AgreementItemsSQL): WithMetadata<Agreement> => {
  const attributesSQLByAgreementId = attributesSQL.reduce((acc, a) => {
    const attributes = acc.get(a.agreementId) || [];
    attributes.push(a);
    acc.set(a.agreementId, attributes);
    return acc;
  }, new Map<string, AgreementAttributeSQL[]>());

  const agreement: Agreement = {
    attributes: (attributesSQLByAgreementId.get(agreementSQL.id) || []).map(
      toAgreementAttribute,
    ),
    consumer: {
      id: unsafeBrandExternalId(agreementSQL.consumerId),
      knodeId: KnodeId.parse(agreementSQL.consumerKnodeId),
    },
    createdAt: agreementSQL.createdAt,
    eserviceId: unsafeBrandId(agreementSQL.eserviceId),
    eserviceVersionId: unsafeBrandId(agreementSQL.eserviceVersionId),
    id: unsafeBrandId(agreementSQL.id),
    producerId: unsafeBrandId(agreementSQL.producerId),
    state: AgreementState.parse(agreementSQL.state),
    updatedAt: agreementSQL.updatedAt,
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

  return buildAgreement(toAgreementAggregator(queryRes));
};

export const aggregateAgreements = (
  queryRes: AgreementAggregatorInput,
): WithMetadata<Agreement>[] => {
  const { agreementsSQL, attributesSQL } = toAgreementsAggregator(queryRes);

  const attributesSQLByAgreementId =
    createAgreementSQLPropertyMap(attributesSQL);

  return agreementsSQL.map((agreementSQL) => {
    const agreementId = unsafeBrandId<AgreementId>(agreementSQL.id);
    return buildAgreement({
      agreementSQL,
      attributesSQL: attributesSQLByAgreementId.get(agreementId) || [],
    });
  });
};

const createAgreementSQLPropertyMap = <T extends AgreementAttributeSQL>(
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
  const { agreementsSQL, attributesSQL } = toAgreementsAggregator(queryRes);

  return {
    agreementSQL: throwIfMultipleOrEmpty(agreementsSQL, "agreement"),
    attributesSQL,
  };
};

const toAgreementsAggregator = (
  queryRes: AgreementAggregatorInput,
): {
  agreementsSQL: AgreementSQL[];
  attributesSQL: AgreementAttributeSQL[];
} => {
  const agreementPKSet = new Set<string>();
  const agreementsSQL: AgreementSQL[] = [];

  const attributePKSet = new Set<string>();
  const attributesSQL: AgreementAttributeSQL[] = [];

  queryRes.forEach((row) => {
    aggregateByPKString(
      row.agreement,
      agreementPKSet,
      agreementsSQL,
      readmodelAgreement,
    );
    aggregateByPKString(
      row.attribute,
      attributePKSet,
      attributesSQL,
      readmodelAgreementAttribute,
    );
  });

  return {
    agreementsSQL,
    attributesSQL,
  };
};
