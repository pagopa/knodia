import type { AttributeId } from "@knodia/attribute-models";
import type { OrganizationId } from "@knodia/common-models/ids";
import type { Organization } from "@knodia/organization-models";

import type {
  OrganizationAttributeSQL,
  OrganizationItemsSQL,
  OrganizationSQL,
} from "../organization.ts";

export const splitOrganizationIntoObjectsSQL = (
  organization: Organization,
  metadataVersion: number,
): OrganizationItemsSQL => {
  const organizationSQL = toOrganizationSQL(organization, metadataVersion);
  const attributesSQL = organization.attributes.map((attributeId) =>
    toOrganizationAttributeSQL(attributeId, organization.id, metadataVersion),
  );

  return {
    attributesSQL,
    organizationSQL,
  };
};

const toOrganizationAttributeSQL = (
  attributeId: AttributeId,
  organizationId: OrganizationId,
  metadataVersion: number,
): OrganizationAttributeSQL => ({
  code: attributeId.code,
  metadataVersion,
  organizationId,
  scheme: attributeId.scheme,
});

const toOrganizationSQL = (
  organization: Organization,
  metadataVersion: number,
): OrganizationSQL => ({
  createdAt: organization.createdAt,
  id: organization.id,
  metadataVersion,
  name: organization.name,
  updatedAt: organization.updatedAt,
});
