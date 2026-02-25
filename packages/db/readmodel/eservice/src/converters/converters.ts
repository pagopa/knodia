import type {
  RequiredAttribute,
  RequiredAttributeGroup,
} from "@knodia/attribute-models";

import { unsafeBrandId } from "@knodia/common-models/ids";
import { EserviceInterface, LocalizedName } from "@knodia/eservice-models";

import type {
  EserviceInterfaceSQL,
  EserviceVersionRequiredAttributeSQL,
} from "../eservice.ts";

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
  prettyName: LocalizedName.parse(interfaceSQL.prettyName),
  updatedAt: new Date(interfaceSQL.updatedAt),
});
