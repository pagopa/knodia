import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { unsafeBrandId } from "@knodia/common-models/ids";
import {
  type CompactEserviceVersion,
  EserviceAccessTokenType,
  EserviceInterface,
  EserviceVersionState,
  type RequiredAttribute,
  type RequiredAttributeGroup,
} from "@knodia/eservice-models";

import type {
  EserviceInterfaceSQL,
  EserviceVersionRequiredAttributeSQL,
  EserviceVersionSQL,
} from "../eservice.ts";

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
