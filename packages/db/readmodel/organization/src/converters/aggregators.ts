import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { Organization } from "@knodia/organization-models";

import { unsafeBrandId } from "@knodia/common-models/ids";
import {
  aggregateByPKString,
  throwIfMultipleOrEmpty,
} from "@knodia/db-readmodel-commons/utils";

import {
  type OrganizationAttributeSQL,
  type OrganizationItemsSQL,
  type OrganizationSQL,
  readmodelOrganization,
  readmodelOrganizationAttribute,
} from "../organization.ts";
import { toOrganizationAttribute } from "./converters.ts";

type OrganizationAggregatorInput = {
  attribute: null | OrganizationAttributeSQL;
  organization: OrganizationSQL;
}[];

export const aggregateOrganization = (
  queryRes: OrganizationAggregatorInput,
): undefined | WithMetadata<Organization> => {
  if (queryRes.length === 0) {
    return undefined;
  }

  return buildOrganization(toOrganizationAggregator(queryRes));
};

export const aggregateOrganizations = (
  queryRes: OrganizationAggregatorInput,
): WithMetadata<Organization>[] => {
  const { attributesSQL, organizationsSQL } =
    toOrganizationsAggregator(queryRes);

  const attributesByOrgId = createOrganizationSQLPropertyMap(attributesSQL);

  return organizationsSQL.map((organizationSQL) =>
    buildOrganization({
      attributesSQL: attributesByOrgId.get(organizationSQL.id) || [],
      organizationSQL,
    }),
  );
};

const buildOrganization = ({
  attributesSQL,
  organizationSQL,
}: OrganizationItemsSQL): WithMetadata<Organization> => ({
  data: {
    attributes: attributesSQL.map(toOrganizationAttribute),
    createdAt: organizationSQL.createdAt,
    id: unsafeBrandId(organizationSQL.id),
    name: organizationSQL.name,
    updatedAt: organizationSQL.updatedAt,
  },
  metadata: { version: organizationSQL.metadataVersion },
});

const createOrganizationSQLPropertyMap = (
  items: OrganizationAttributeSQL[],
): Map<string, OrganizationAttributeSQL[]> =>
  items.reduce((acc, item) => {
    const values = acc.get(item.organizationId) || [];
    values.push(item);
    acc.set(item.organizationId, values);
    return acc;
  }, new Map<string, OrganizationAttributeSQL[]>());

const toOrganizationAggregator = (
  queryRes: OrganizationAggregatorInput,
): OrganizationItemsSQL => {
  const { attributesSQL, organizationsSQL } =
    toOrganizationsAggregator(queryRes);

  return {
    attributesSQL,
    organizationSQL: throwIfMultipleOrEmpty(
      organizationsSQL,
      "organization",
      (o) => o.id,
    ),
  };
};

const toOrganizationsAggregator = (
  queryRes: OrganizationAggregatorInput,
): {
  attributesSQL: OrganizationAttributeSQL[];
  organizationsSQL: OrganizationSQL[];
} => {
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

  return {
    attributesSQL,
    organizationsSQL,
  };
};
