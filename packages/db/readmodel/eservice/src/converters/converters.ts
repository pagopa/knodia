import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { unsafeBrandId } from "@knodia/common-models/ids";
import {
  type CompactEservice,
  type CompactEserviceVersion,
  EserviceAccessTokenType,
  EserviceInterface,
  EserviceMode,
  EserviceVersionState,
  type RequiredAttribute,
  type RequiredAttributeGroup,
} from "@knodia/eservice-models";

import type {
  EserviceInterfaceSQL,
  EserviceSQL,
  EserviceVersionRequiredAttributeSQL,
  EserviceVersionSQL,
} from "../eservice.ts";

import { toEservicesAggregator } from "./aggregators.ts";

export const toCompactEserviceVersion = (
  eserviceVersionSQL: EserviceVersionSQL,
): WithMetadata<CompactEserviceVersion> => ({
  data: {
    accessTokenAudience: eserviceVersionSQL.accessTokenAudience,
    accessTokenDuration: eserviceVersionSQL.accessTokenDuration,
    accessTokenType: EserviceAccessTokenType.parse(
      eserviceVersionSQL.accessTokenType,
    ),
    createdAt: new Date(eserviceVersionSQL.createdAt),
    id: unsafeBrandId(eserviceVersionSQL.id),
    maxDailyCallsPerConsumer: eserviceVersionSQL.maxDailyCallsPerConsumer,
    maxDailyCallsPerKnode: eserviceVersionSQL.maxDailyCallsPerKnode,
    state: EserviceVersionState.parse(eserviceVersionSQL.state),
    updatedAt: new Date(eserviceVersionSQL.updatedAt),
    versionNumber: eserviceVersionSQL.versionNumber,
  },
  metadata: { version: eserviceVersionSQL.metadataVersion },
});

export const toCompactEservice = (
  eserviceSQL: EserviceSQL,
): WithMetadata<CompactEservice> => ({
  data: {
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
  },
  metadata: { version: eserviceSQL.metadataVersion },
});

export const toCompactEservices = (
  eservicesSQL: EserviceSQL[],
): WithMetadata<CompactEservice>[] => {
  const aggregatedEserviceSQL = toEservicesAggregator(
    eservicesSQL.map((eservice) => ({
      eservice,
    })),
  );
  return aggregatedEserviceSQL.eservicesSQL.map(toCompactEservice);
};

export const toGroupedRequiredAttributes = (
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

export const toEserviceVersionInterface = (
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
