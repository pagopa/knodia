import type { Agreement } from "@knodia/agreement-models";
import type { Attribute } from "@knodia/attribute-models";
import type { AgreementId } from "@knodia/common-models/ids";

import type {
  AgreementItemsSQL,
  AgreementRequiredAttributeSQL,
  AgreementSQL,
} from "../agreement.ts";

export const splitAgreementIntoObjectsSQL = (
  agreement: Agreement,
  metadataVersion: number,
): AgreementItemsSQL => {
  const agreementSQL = toAgreementSQL(agreement, metadataVersion);
  const requiredAttributesSQL = agreement.requiredAttributes.flatMap(
    (group, groupId) =>
      toAgreementRequiredAttributeSQL(
        group,
        groupId,
        agreement.id,
        metadataVersion,
      ),
  );

  return {
    agreementSQL,
    requiredAttributesSQL,
  };
};

const toAgreementRequiredAttributeSQL = (
  group: Attribute[],
  groupId: number,
  agreementId: AgreementId,
  metadataVersion: number,
): AgreementRequiredAttributeSQL[] =>
  group.map((attribute) => ({
    ...attribute,
    agreementId,
    groupId,
    metadataVersion,
  }));

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
