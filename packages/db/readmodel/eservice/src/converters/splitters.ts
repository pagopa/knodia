import type { AttributeId } from "@knodia/attribute-models";
import type { EserviceId, EserviceVersionId } from "@knodia/common-models/ids";
import type {
  EserviceCategorySQL,
  EserviceInterfaceSQL,
  EserviceItemsSQL,
  EserviceSQL,
  EserviceVersionRequiredAttributeSQL,
  EserviceVersionSQL,
} from "@knodia/db-readmodel-eservice";
import type {
  Eservice,
  EserviceCategory,
  EserviceVersion,
} from "@knodia/eservice-models";

export const splitEserviceIntoObjectsSQL = (
  eservice: Eservice,
  metadataVersion: number,
): EserviceItemsSQL => {
  const eserviceSQL = toEserviceSQL(eservice, metadataVersion);

  const eserviceCategoriesSQL = eservice.categories.map((category) =>
    toEserviceCategorySQL(category, eservice.id, metadataVersion),
  );

  const {
    eserviceInterfacesSQL,
    eserviceVersionRequiredAttributesSQL,
    eserviceVersionsSQL,
  } = eservice.versions.reduce(
    (
      acc: {
        eserviceInterfacesSQL: EserviceInterfaceSQL[];
        eserviceVersionRequiredAttributesSQL: EserviceVersionRequiredAttributeSQL[];
        eserviceVersionsSQL: EserviceVersionSQL[];
      },
      currentEserviceVersion: EserviceVersion,
    ) => {
      const {
        eserviceInterfaceSQL,
        eserviceVersionRequiredAttributesSQL,
        eserviceVersionSQL,
      } = splitEserviceVersionIntoObjectsSQL(
        eservice.id,
        currentEserviceVersion,
        metadataVersion,
      );

      return {
        eserviceInterfacesSQL: acc.eserviceInterfacesSQL.concat([
          eserviceInterfaceSQL,
        ]),
        eserviceVersionRequiredAttributesSQL:
          acc.eserviceVersionRequiredAttributesSQL.concat(
            eserviceVersionRequiredAttributesSQL,
          ),
        eserviceVersionsSQL: acc.eserviceVersionsSQL.concat([
          eserviceVersionSQL,
        ]),
      };
    },
    {
      eserviceInterfacesSQL: [],
      eserviceVersionRequiredAttributesSQL: [],
      eserviceVersionsSQL: [],
    },
  );

  return {
    eserviceCategoriesSQL,
    eserviceInterfacesSQL,
    eserviceSQL,
    eserviceVersionRequiredAttributesSQL,
    eserviceVersionsSQL,
  };
};

const toEserviceCategorySQL = (
  eserviceCategory: EserviceCategory,
  eserviceId: EserviceId,
  metadataVersion: number,
): EserviceCategorySQL => ({
  ...eserviceCategory,
  eserviceId,
  metadataVersion,
});

const splitEserviceVersionIntoObjectsSQL = (
  eserviceId: EserviceId,
  eserviceVersion: EserviceVersion,
  metadataVersion: number,
): {
  eserviceInterfaceSQL: EserviceInterfaceSQL;
  eserviceVersionRequiredAttributesSQL: EserviceVersionRequiredAttributeSQL[];
  eserviceVersionSQL: EserviceVersionSQL;
} => ({
  eserviceInterfaceSQL: {
    ...eserviceVersion.interfaceDocument,
    eserviceId,
    eserviceVersionId: eserviceVersion.id,
    metadataVersion,
  },
  eserviceVersionRequiredAttributesSQL:
    eserviceVersion.requiredAttributes.flatMap((group, groupId) =>
      toEserviceVersionRequiredAttributeSQL(
        group,
        groupId,
        eserviceId,
        eserviceVersion.id,
        metadataVersion,
      ),
    ),
  eserviceVersionSQL: toEserviceVersionSQL({
    eserviceId,
    eserviceVersion,
    metadataVersion,
  }),
});

const toEserviceVersionRequiredAttributeSQL = (
  group: AttributeId[],
  groupId: number,
  eserviceId: EserviceId,
  eserviceVersionId: EserviceVersionId,
  metadataVersion: number,
): EserviceVersionRequiredAttributeSQL[] =>
  group.map((attribute) => ({
    ...attribute,
    eserviceId,
    eserviceVersionId,
    groupId,
    metadataVersion,
  }));

const toEserviceVersionSQL = ({
  eserviceId,
  eserviceVersion,
  metadataVersion,
}: {
  eserviceId: EserviceId;
  eserviceVersion: EserviceVersion;
  metadataVersion: number;
}): EserviceVersionSQL => ({
  accessTokenAudience: eserviceVersion.accessTokenAudience,
  accessTokenDuration: eserviceVersion.accessTokenDuration,
  accessTokenType: eserviceVersion.accessTokenType,
  createdAt: eserviceVersion.createdAt,
  eserviceId,
  id: eserviceVersion.id,
  maxDailyCallsPerConsumer: eserviceVersion.maxDailyCallsPerConsumer,
  maxDailyCallsPerKnode: eserviceVersion.maxDailyCallsPerKnode,
  metadataVersion,
  state: eserviceVersion.state,
  updatedAt: eserviceVersion.updatedAt,
  versionNumber: eserviceVersion.versionNumber,
});

const toEserviceSQL = (
  eservice: Eservice,
  metadataVersion: number,
): EserviceSQL => ({
  createdAt: eservice.createdAt,
  description: eservice.description,
  id: eservice.id,
  isConsumerOperatorIdentificationRequired:
    eservice.isConsumerOperatorIdentificationRequired,
  isSignalHubEnabled: eservice.isSignalHubEnabled,
  metadataVersion,
  mode: eservice.mode,
  name: eservice.name,
  producerId: eservice.producerId,
  updatedAt: eservice.updatedAt,
});
