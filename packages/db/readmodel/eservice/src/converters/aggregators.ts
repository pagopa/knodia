import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import {
  aggregateByPKString,
  throwIfMultipleOrEmpty,
} from "@knodia/db-readmodel-commons/utils";
import {
  type Eservice,
  EserviceAccessTokenType,
  EserviceInterface,
  EserviceMode,
  type EserviceVersion,
  EserviceVersionState,
  type RequiredAttribute,
  type RequiredAttributeGroup,
} from "@knodia/eservice-models";

import {
  type EserviceCategorySQL,
  type EserviceInterfaceSQL,
  type EserviceItemsSQL,
  type EserviceSQL,
  type EserviceVersionRequiredAttributeSQL,
  type EserviceVersionSQL,
  readmodelEservice,
  readmodelEserviceCategory,
  readmodelEserviceInterface,
  readmodelEserviceVersion,
  readmodelEserviceVersionRequiredAttribute,
} from "../eservice.ts";

const aggregateEserviceVersion = ({
  interfaceSQL,
  requiredAttributesSQL,
  versionSQL: versionSQL,
}: {
  interfaceSQL: EserviceInterfaceSQL;
  requiredAttributesSQL: EserviceVersionRequiredAttributeSQL[];
  versionSQL: EserviceVersionSQL;
}): EserviceVersion => ({
  accessTokenAudience: versionSQL.accessTokenAudience,
  accessTokenDuration: versionSQL.accessTokenDuration,
  accessTokenType: EserviceAccessTokenType.parse(versionSQL.accessTokenType),
  createdAt: new Date(versionSQL.createdAt),
  id: unsafeBrandId(versionSQL.id),
  interfaceDocument: toEserviceVersionInterface(interfaceSQL),
  maxDailyCallsPerConsumer: versionSQL.maxDailyCallsPerConsumer,
  maxDailyCallsPerKnode: versionSQL.maxDailyCallsPerKnode,
  requiredAttributes: toGroupedRequiredAttributes(requiredAttributesSQL),
  state: EserviceVersionState.parse(versionSQL.state),
  updatedAt: new Date(versionSQL.updatedAt),
  versionNumber: versionSQL.versionNumber,
});

const toGroupedRequiredAttributes = (
  requiredAttributesSQL: EserviceVersionRequiredAttributeSQL[],
): RequiredAttributeGroup[] => {
  const groupsMap = new Map<number, RequiredAttribute[]>();

  for (const attribute of requiredAttributesSQL) {
    const group = groupsMap.get(attribute.groupId) ?? [];
    group.push({ code: attribute.code, scheme: attribute.scheme });
    groupsMap.set(attribute.groupId, group);
  }

  const sortedGroups = Array.from(groupsMap.entries())
    .sort(([groupId1], [groupId2]) => groupId1 - groupId2)
    .map(([, attributes]) => attributes);

  return sortedGroups;
};

const toEserviceVersionInterface = (
  interfaceSQL: EserviceInterfaceSQL,
): EserviceInterface => ({
  checksum: interfaceSQL.checksum,
  contentType: interfaceSQL.contentType,
  createdAt: new Date(interfaceSQL.createdAt),
  id: unsafeBrandId(interfaceSQL.id),
  name: interfaceSQL.name,
  path: interfaceSQL.path,
  prettyName: interfaceSQL.prettyName,
  updatedAt: new Date(interfaceSQL.updatedAt),
});

export const aggregateEservice = ({
  eserviceCategoriesSQL,
  eserviceInterfacesSQL,
  eserviceSQL,
  eserviceVersionRequiredAttributesSQL,
  eserviceVersionsSQL,
}: EserviceItemsSQL): WithMetadata<Eservice> => {
  const interfacesSQLByVersionId = eserviceInterfacesSQL.reduce((acc, i) => {
    acc.set(i.eserviceVersionId, i);
    return acc;
  }, new Map<string, EserviceInterfaceSQL>());
  const requiredAttributesSQLByVersionId =
    eserviceVersionRequiredAttributesSQL.reduce((acc, a) => {
      const attributes = acc.get(a.eserviceVersionId) || [];
      attributes.push(a);
      acc.set(a.eserviceVersionId, attributes);
      return acc;
    }, new Map<string, EserviceVersionRequiredAttributeSQL[]>());
  const eserviceVersions = eserviceVersionsSQL.map((versionSQL) => {
    const interfaceSQL = interfacesSQLByVersionId.get(versionSQL.id);
    if (!interfaceSQL) {
      throw new Error(
        `Missing interface for E-service version with id ${versionSQL.id}`,
      );
    }

    return aggregateEserviceVersion({
      interfaceSQL,
      requiredAttributesSQL:
        requiredAttributesSQLByVersionId.get(versionSQL.id) || [],
      versionSQL: versionSQL,
    });
  });

  const categories = eserviceCategoriesSQL.map((categorySQL) => ({
    code: categorySQL.code,
    scheme: categorySQL.scheme,
  }));

  const eservice: Eservice = {
    categories,
    createdAt: new Date(eserviceSQL.createdAt),
    description: eserviceSQL.description,
    id: unsafeBrandId(eserviceSQL.id),
    isConsumerOperatorIdentificationRequired:
      eserviceSQL.isConsumerOperatorIdentificationRequired,
    isSignalHubEnabled: eserviceSQL.isSignalHubEnabled,
    mode: EserviceMode.parse(eserviceSQL.mode),
    name: eserviceSQL.name,
    producerId: unsafeBrandId(eserviceSQL.producerId),
    updatedAt: new Date(eserviceSQL.updatedAt),
    versions: eserviceVersions,
  };
  return {
    data: eservice,
    metadata: { version: eserviceSQL.metadataVersion },
  };
};

export const aggregateEservices = ({
  categoriesSQL,
  eservicesSQL,
  interfacesSQL,
  requiredAttributesSQL,
  versionsSQL,
}: {
  categoriesSQL: EserviceCategorySQL[];
  eservicesSQL: EserviceSQL[];
  interfacesSQL: EserviceInterfaceSQL[];
  requiredAttributesSQL: EserviceVersionRequiredAttributeSQL[];
  versionsSQL: EserviceVersionSQL[];
}): WithMetadata<Eservice>[] => {
  const eserviceVersionsSQLByEserviceId =
    createEserviceSQLPropertyMap(versionsSQL);
  const interfacesSQLByEserviceId = createEserviceSQLPropertyMap(interfacesSQL);
  const requiredAttributesSQLByEserviceId = createEserviceSQLPropertyMap(
    requiredAttributesSQL,
  );
  const categoriesSQLByEserviceId = createEserviceSQLPropertyMap(categoriesSQL);

  return eservicesSQL.map((eserviceSQL) => {
    const eserviceId = unsafeBrandId<EserviceId>(eserviceSQL.id);
    return aggregateEservice({
      eserviceCategoriesSQL: categoriesSQLByEserviceId.get(eserviceId) || [],
      eserviceInterfacesSQL: interfacesSQLByEserviceId.get(eserviceId) || [],
      eserviceSQL,
      eserviceVersionRequiredAttributesSQL:
        requiredAttributesSQLByEserviceId.get(eserviceId) || [],
      eserviceVersionsSQL:
        eserviceVersionsSQLByEserviceId.get(eserviceId) || [],
    });
  });
};

const createEserviceSQLPropertyMap = <
  T extends
    | EserviceCategorySQL
    | EserviceInterfaceSQL
    | EserviceVersionRequiredAttributeSQL
    | EserviceVersionSQL,
>(
  items: T[],
): Map<EserviceId, T[]> =>
  items.reduce((acc, item) => {
    const eserviceId = unsafeBrandId<EserviceId>(item.eserviceId);
    const values = acc.get(eserviceId) || [];
    values.push(item);
    acc.set(eserviceId, values);

    return acc;
  }, new Map<EserviceId, T[]>());

export const toEserviceAggregator = (
  queryRes: {
    category: EserviceCategorySQL | null;
    eservice: EserviceSQL;
    interface: EserviceInterfaceSQL | null;
    requiredAttribute: EserviceVersionRequiredAttributeSQL | null;
    version: EserviceVersionSQL | null;
  }[],
): EserviceItemsSQL => {
  const {
    categoriesSQL: categoriesSQL,
    eservicesSQL: eservicesSQL,
    interfacesSQL: interfacesSQL,
    requiredAttributesSQL: requiredAttributesSQL,
    versionsSQL: versionsSQL,
  } = toEservicesAggregator(queryRes);

  const eserviceSQL = throwIfMultipleOrEmpty(eservicesSQL, "e-service");

  return {
    eserviceCategoriesSQL: categoriesSQL,
    eserviceInterfacesSQL: interfacesSQL,
    eserviceSQL,
    eserviceVersionRequiredAttributesSQL: requiredAttributesSQL,
    eserviceVersionsSQL: versionsSQL,
  };
};

export const toEservicesAggregator = (
  queryRes: {
    category?: EserviceCategorySQL | null;
    eservice: EserviceSQL;
    interface?: EserviceInterfaceSQL | null;
    requiredAttribute?: EserviceVersionRequiredAttributeSQL | null;
    version?: EserviceVersionSQL | null;
  }[],
): {
  categoriesSQL: EserviceCategorySQL[];
  eservicesSQL: EserviceSQL[];
  interfacesSQL: EserviceInterfaceSQL[];
  requiredAttributesSQL: EserviceVersionRequiredAttributeSQL[];
  versionsSQL: EserviceVersionSQL[];
} => {
  const eservicePKSet = new Set<string>();
  const eservicesSQL: EserviceSQL[] = [];

  const categoryPKSet = new Set<string>();
  const categoriesSQL: EserviceCategorySQL[] = [];

  const versionPKSet = new Set<string>();
  const versionsSQL: EserviceVersionSQL[] = [];

  const interfacePKSet = new Set<string>();
  const interfacesSQL: EserviceInterfaceSQL[] = [];

  const requiredAttributePKSet = new Set<string>();
  const requiredAttributesSQL: EserviceVersionRequiredAttributeSQL[] = [];

  queryRes.forEach((row) => {
    aggregateByPKString(
      row.eservice,
      eservicePKSet,
      eservicesSQL,
      readmodelEservice,
    );
    aggregateByPKString(
      row.category ?? null,
      categoryPKSet,
      categoriesSQL,
      readmodelEserviceCategory,
    );
    aggregateByPKString(
      row.version ?? null,
      versionPKSet,
      versionsSQL,
      readmodelEserviceVersion,
    );
    aggregateByPKString(
      row.interface ?? null,
      interfacePKSet,
      interfacesSQL,
      readmodelEserviceInterface,
    );
    aggregateByPKString(
      row.requiredAttribute ?? null,
      requiredAttributePKSet,
      requiredAttributesSQL,
      readmodelEserviceVersionRequiredAttribute,
    );
  });

  return {
    categoriesSQL: categoriesSQL,
    eservicesSQL: eservicesSQL,
    interfacesSQL: interfacesSQL,
    requiredAttributesSQL: requiredAttributesSQL,
    versionsSQL: versionsSQL,
  };
};
