import type { EserviceId } from "@knodia/common-models/ids";
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
  RequiredAttribute,
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
  group: RequiredAttribute[],
  groupId: number,
  eserviceId: EserviceId,
  eserviceVersionId: string,
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
  ...eserviceVersion,
  eserviceId,
  interfaceId: eserviceVersion.interfaceDocument.id,
  metadataVersion,
});

export const toEserviceSQL = (
  eservice: Eservice,
  metadataVersion: number,
): EserviceSQL => ({
  ...eservice,
  metadataVersion,
});
