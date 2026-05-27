import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { toOptionalExternalResource } from "@knodia/common-models/externalResource";
import {
  type EserviceId,
  type EserviceTemplateId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import {
  aggregateByPKString,
  throwIfMultipleOrEmpty,
} from "@knodia/db-readmodel-commons/utils";
import {
  type Eservice,
  EserviceAccessTokenType,
  EserviceMode,
  type EserviceVersion,
  EserviceVersionState,
  LocalizedDescription,
  LocalizedName,
  PurposeFormAnswer,
  type ReceiveDataConfig,
} from "@knodia/eservice-models";

import {
  type EserviceCategorySQL,
  type EserviceInterfaceSQL,
  type EserviceItemsSQL,
  type EservicePurposeFormAnswerSQL,
  type EserviceSQL,
  type EserviceVersionRequiredAttributeSQL,
  type EserviceVersionSQL,
  readmodelEservice,
  readmodelEserviceCategory,
  readmodelEserviceInterface,
  readmodelEservicePurposeFormAnswer,
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
  purposeFormAnswer?: EservicePurposeFormAnswerSQL | null;
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

  return {
    requiredAttributesSQL,
    versionSQL: throwIfMultipleOrEmpty(
      versionsSQL,
      "e-service version",
      (v) => v.id,
    ),
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
      row.version,
      versionPKSet,
      versionsSQL,
      readmodelEserviceVersion,
    );
    aggregateByPKString(
      row.requiredAttribute,
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

const toReceiveDataConfig = (
  purposeFormAnswersSQL: EservicePurposeFormAnswerSQL[],
): ReceiveDataConfig | undefined => {
  if (purposeFormAnswersSQL.length === 0) {
    return undefined;
  }
  return {
    purposeFormAnswers: purposeFormAnswersSQL.map((sql) =>
      PurposeFormAnswer.parse({
        description: sql.description,
        id: sql.id,
        name: sql.name,
        schema: sql.schema,
        texts: sql.texts,
        uiSchema: sql.uiSchema,
        uiTexts: sql.uiTexts,
        version: sql.version,
      }),
    ),
  };
};

const buildEservice = ({
  eserviceCategoriesSQL,
  eserviceInterfacesSQL,
  eservicePurposeFormAnswersSQL,
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
      versionSQL,
    });
  });

  const categories = eserviceCategoriesSQL.map((categorySQL) => ({
    code: categorySQL.code,
    scheme: categorySQL.scheme,
  }));

  const receiveDataConfig = toReceiveDataConfig(eservicePurposeFormAnswersSQL);

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
    ...(receiveDataConfig !== undefined ? { receiveDataConfig } : {}),
    template: toOptionalExternalResource<EserviceTemplateId>(
      eserviceSQL.templateId,
      eserviceSQL.templateKnodeId,
    ),
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
    purposeFormAnswersSQL,
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
  const purposeFormAnswersSQLByEserviceId = createEserviceSQLPropertyMap(
    purposeFormAnswersSQL,
  );

  return eservicesSQL.map((eserviceSQL) => {
    const eserviceId = unsafeBrandId<EserviceId>(eserviceSQL.id);
    return buildEservice({
      eserviceCategoriesSQL: categoriesSQLByEserviceId.get(eserviceId) || [],
      eserviceInterfacesSQL: interfacesSQLByEserviceId.get(eserviceId) || [],
      eservicePurposeFormAnswersSQL:
        purposeFormAnswersSQLByEserviceId.get(eserviceId) || [],
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
    | EservicePurposeFormAnswerSQL
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
    categoriesSQL,
    eservicesSQL,
    interfacesSQL,
    purposeFormAnswersSQL,
    requiredAttributesSQL,
    versionsSQL,
  } = toEservicesAggregator(queryRes);

  return {
    eserviceCategoriesSQL: categoriesSQL,
    eserviceInterfacesSQL: interfacesSQL,
    eservicePurposeFormAnswersSQL: purposeFormAnswersSQL,
    eserviceSQL: throwIfMultipleOrEmpty(eservicesSQL, "e-service", (e) => e.id),
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
  purposeFormAnswersSQL: EservicePurposeFormAnswerSQL[];
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

  const purposeFormAnswerPKSet = new Set<string>();
  const purposeFormAnswersSQL: EservicePurposeFormAnswerSQL[] = [];

  queryRes.forEach((row) => {
    aggregateByPKString(
      row.eservice,
      eservicePKSet,
      eservicesSQL,
      readmodelEservice,
    );
    aggregateByPKString(
      row.category,
      categoryPKSet,
      categoriesSQL,
      readmodelEserviceCategory,
    );
    aggregateByPKString(
      row.version,
      versionPKSet,
      versionsSQL,
      readmodelEserviceVersion,
    );
    aggregateByPKString(
      row.interface,
      interfacePKSet,
      interfacesSQL,
      readmodelEserviceInterface,
    );
    aggregateByPKString(
      row.requiredAttribute,
      requiredAttributePKSet,
      requiredAttributesSQL,
      readmodelEserviceVersionRequiredAttribute,
    );
    aggregateByPKString(
      row.purposeFormAnswer,
      purposeFormAnswerPKSet,
      purposeFormAnswersSQL,
      readmodelEservicePurposeFormAnswer,
    );
  });

  return {
    categoriesSQL,
    eservicesSQL,
    interfacesSQL,
    purposeFormAnswersSQL,
    requiredAttributesSQL,
    versionsSQL,
  };
};
