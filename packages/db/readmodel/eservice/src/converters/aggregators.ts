import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import {
  aggregateByPKString,
  throwIfMultipleOrEmpty,
} from "@knodia/db-readmodel-commons/utils";
import {
  Eservice,
  EserviceAccessTokenType,
  EserviceMode,
  EserviceVersion,
  EserviceVersionState,
  LocalizedDescription,
  LocalizedName,
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
import {
  toEserviceVersionInterface,
  toGroupedRequiredAttributes,
} from "./converters.ts";

type EserviceAggregatorInput = {
  category?: EserviceCategorySQL | null;
  eservice: EserviceSQL;
  interface?: EserviceInterfaceSQL | null;
  requiredAttribute?: EserviceVersionRequiredAttributeSQL | null;
  version?: EserviceVersionSQL | null;
}[];

type EserviceVersionAggregatorInput = {
  interface?: EserviceInterfaceSQL | null;
  requiredAttribute: EserviceVersionRequiredAttributeSQL | null;
  version: EserviceVersionSQL;
}[];

export const aggregateEserviceVersion = (
  queryRes: EserviceVersionAggregatorInput,
): Omit<EserviceVersion, "interfaceDocument"> | undefined => {
  if (queryRes.length === 0) {
    return undefined;
  }

  return buildEserviceVersion(toEserviceVersionAggregator(queryRes));
};

function buildEserviceVersion({
  interfaceSQL,
  requiredAttributesSQL,
  versionSQL,
}: {
  interfaceSQL?: never;
  requiredAttributesSQL: EserviceVersionRequiredAttributeSQL[];
  versionSQL: EserviceVersionSQL;
}): Omit<EserviceVersion, "interfaceDocument">;
function buildEserviceVersion({
  interfaceSQL,
  requiredAttributesSQL,
  versionSQL,
}: {
  interfaceSQL: EserviceInterfaceSQL;
  requiredAttributesSQL: EserviceVersionRequiredAttributeSQL[];
  versionSQL: EserviceVersionSQL;
}): EserviceVersion;
function buildEserviceVersion({
  interfaceSQL,
  requiredAttributesSQL,
  versionSQL,
}: {
  interfaceSQL?: EserviceInterfaceSQL;
  requiredAttributesSQL: EserviceVersionRequiredAttributeSQL[];
  versionSQL: EserviceVersionSQL;
}): EserviceVersion | Omit<EserviceVersion, "interfaceDocument"> {
  return {
    accessTokenAudience: versionSQL.accessTokenAudience,
    accessTokenDuration: versionSQL.accessTokenDuration,
    accessTokenType: EserviceAccessTokenType.parse(versionSQL.accessTokenType),
    createdAt: versionSQL.createdAt,
    id: unsafeBrandId(versionSQL.id),
    maxDailyCallsPerConsumer: versionSQL.maxDailyCallsPerConsumer,
    maxDailyCallsPerKnode: versionSQL.maxDailyCallsPerKnode,
    requiredAttributes: toGroupedRequiredAttributes(requiredAttributesSQL),
    state: EserviceVersionState.parse(versionSQL.state),
    updatedAt: versionSQL.updatedAt,
    versionNumber: versionSQL.versionNumber,
    ...(interfaceSQL
      ? { interfaceDocument: toEserviceVersionInterface(interfaceSQL) }
      : {}),
  };
}

const toEserviceVersionAggregator = (
  queryRes: EserviceVersionAggregatorInput,
): {
  requiredAttributesSQL: EserviceVersionRequiredAttributeSQL[];
  versionSQL: EserviceVersionSQL;
} => {
  const { requiredAttributesSQL, versionsSQL } =
    toEserviceVersionsAggregator(queryRes);

  const eserviceVersion = throwIfMultipleOrEmpty(
    versionsSQL,
    "e-service version",
  );

  return {
    requiredAttributesSQL: requiredAttributesSQL,
    versionSQL: eserviceVersion,
  };
};

const toEserviceVersionsAggregator = (
  queryRes: EserviceVersionAggregatorInput,
): {
  requiredAttributesSQL: EserviceVersionRequiredAttributeSQL[];
  versionsSQL: EserviceVersionSQL[];
} => {
  const versionPKSet = new Set<string>();
  const versionsSQL: EserviceVersionSQL[] = [];

  const requiredAttributePKSet = new Set<string>();
  const requiredAttributesSQL: EserviceVersionRequiredAttributeSQL[] = [];

  queryRes.forEach((row) => {
    aggregateByPKString(
      row.version ?? null,
      versionPKSet,
      versionsSQL,
      readmodelEserviceVersion,
    );
    aggregateByPKString(
      row.requiredAttribute ?? null,
      requiredAttributePKSet,
      requiredAttributesSQL,
      readmodelEserviceVersionRequiredAttribute,
    );
  });

  return {
    requiredAttributesSQL,
    versionsSQL,
  };
};

const buildEservice = ({
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

    return buildEserviceVersion({
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
    createdAt: eserviceSQL.createdAt,
    description: LocalizedDescription.parse(eserviceSQL.description),
    id: unsafeBrandId(eserviceSQL.id),
    isConsumerOperatorIdentificationRequired:
      eserviceSQL.isConsumerOperatorIdentificationRequired,
    isSignalHubEnabled: eserviceSQL.isSignalHubEnabled,
    mode: EserviceMode.parse(eserviceSQL.mode),
    name: LocalizedName.parse(eserviceSQL.name),
    producerId: unsafeBrandId(eserviceSQL.producerId),
    updatedAt: eserviceSQL.updatedAt,
    versions: eserviceVersions,
  };
  return {
    data: eservice,
    metadata: { version: eserviceSQL.metadataVersion },
  };
};

export const aggregateEservice = (
  queryRes: EserviceAggregatorInput,
): undefined | WithMetadata<Eservice> => {
  if (queryRes.length === 0) {
    return undefined;
  }

  return buildEservice(toEserviceAggregator(queryRes));
};

export const aggregateEservices = (
  queryRes: EserviceAggregatorInput,
): WithMetadata<Eservice>[] => {
  const {
    categoriesSQL,
    eservicesSQL,
    interfacesSQL,
    requiredAttributesSQL,
    versionsSQL,
  } = toEservicesAggregator(queryRes);

  const eserviceVersionsSQLByEserviceId =
    createEserviceSQLPropertyMap(versionsSQL);
  const interfacesSQLByEserviceId = createEserviceSQLPropertyMap(interfacesSQL);
  const requiredAttributesSQLByEserviceId = createEserviceSQLPropertyMap(
    requiredAttributesSQL,
  );
  const categoriesSQLByEserviceId = createEserviceSQLPropertyMap(categoriesSQL);

  return eservicesSQL.map((eserviceSQL) => {
    const eserviceId = unsafeBrandId<EserviceId>(eserviceSQL.id);
    return buildEservice({
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

const toEserviceAggregator = (
  queryRes: EserviceAggregatorInput,
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

const toEservicesAggregator = (
  queryRes: EserviceAggregatorInput,
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
    categoriesSQL,
    eservicesSQL,
    interfacesSQL,
    requiredAttributesSQL,
    versionsSQL,
  };
};
