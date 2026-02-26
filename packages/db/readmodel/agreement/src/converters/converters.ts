import type { Attribute, AttributeGroup } from "@knodia/attribute-models";

import type { AgreementRequiredAttributeSQL } from "../agreement.ts";

export const toGroupedRequiredAttributes = (
  requiredAttributesSQL: AgreementRequiredAttributeSQL[],
): AttributeGroup[] => {
  const groupsMap = new Map<number, Attribute[]>();

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
