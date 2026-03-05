import type { Organization } from "@knodia/organization-models";

import { unsafeBrandId } from "@knodia/common-models/ids";
import { aggregateByPKString } from "@knodia/db-readmodel-commons/utils";

import {
  type OrganizationAttributeSQL,
  type OrganizationSQL,
  readmodelOrganization,
  readmodelOrganizationAttribute,
} from "../organization.ts";
import { toOrganizationAttribute } from "./converters.ts";

type OrganizationAggregatorInput = {
  attribute: null | OrganizationAttributeSQL;
  organization: OrganizationSQL;
}[];

const buildOrganization = (
  organizationSQL: OrganizationSQL,
  attributesSQL: OrganizationAttributeSQL[],
): Organization => ({
  attributes: attributesSQL.map(toOrganizationAttribute),
  createdAt: organizationSQL.createdAt,
  id: unsafeBrandId(organizationSQL.id),
  name: organizationSQL.name,
});

export const aggregateOrganization = (
  queryRes: OrganizationAggregatorInput,
): Organization | undefined => {
  if (queryRes.length === 0) {
    return undefined;
  }

  return aggregateOrganizations(queryRes).at(0);
};

export const aggregateOrganizations = (
  queryRes: OrganizationAggregatorInput,
): Organization[] => {
  const organizationPKSet = new Set<string>();
  const organizationsSQL: OrganizationSQL[] = [];

  const attributePKSet = new Set<string>();
  const attributesSQL: OrganizationAttributeSQL[] = [];

  queryRes.forEach((row) => {
    aggregateByPKString(
      row.organization,
      organizationPKSet,
      organizationsSQL,
      readmodelOrganization,
    );
    aggregateByPKString(
      row.attribute,
      attributePKSet,
      attributesSQL,
      readmodelOrganizationAttribute,
    );
  });

  const attributesByOrgId = attributesSQL.reduce((acc, a) => {
    const attrs = acc.get(a.organizationId) || [];
    attrs.push(a);
    acc.set(a.organizationId, attrs);
    return acc;
  }, new Map<string, OrganizationAttributeSQL[]>());

  return organizationsSQL.map((org) =>
    buildOrganization(org, attributesByOrgId.get(org.id) || []),
  );
};
