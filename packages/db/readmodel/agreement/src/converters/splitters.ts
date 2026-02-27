import type { Agreement } from "@knodia/agreement-models";
import type { Attribute } from "@knodia/attribute-models";
import type { AgreementId } from "@knodia/common-models/ids";

import type {
  AgreementAttributeSQL,
  AgreementItemsSQL,
  AgreementSQL,
} from "../agreement.ts";

export const splitAgreementIntoObjectsSQL = (
  agreement: Agreement,
  metadataVersion: number,
): AgreementItemsSQL => {
  const agreementSQL = toAgreementSQL(agreement, metadataVersion);
  const attributesSQL = agreement.attributes.flatMap((attribute) =>
    toAgreementAttributeSQL(attribute, agreement.id, metadataVersion),
  );

  return {
    agreementSQL,
    attributesSQL,
  };
};

const toAgreementAttributeSQL = (
  attribute: Attribute,
  agreementId: AgreementId,
  metadataVersion: number,
): AgreementAttributeSQL => ({
  agreementId: agreementId,
  code: attribute.code,
  metadataVersion,
  scheme: attribute.scheme,
});

const toAgreementSQL = (
  agreement: Agreement,
  metadataVersion: number,
): AgreementSQL => ({
  consumerId: agreement.consumer.id,
  consumerKnodeId: agreement.consumer.knodeId,
  createdAt: agreement.createdAt,
  eserviceId: agreement.eserviceId,
  eserviceVersionId: agreement.eserviceVersionId,
  id: agreement.id,
  metadataVersion,
  producerId: agreement.producerId,
  state: agreement.state,
  updatedAt: agreement.updatedAt,
});
