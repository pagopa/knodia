import type { AttributeId } from "@knodia/attribute-models";

import type { OrganizationAttributeSQL } from "../organization.ts";

export const toOrganizationAttribute = (
  attributeSQL: OrganizationAttributeSQL,
): AttributeId => ({
  code: attributeSQL.code,
  scheme: attributeSQL.scheme,
});
