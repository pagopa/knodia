import { Organization } from "@knodia/organization-models";
import {
  getMockOrganization,
  toExpectOrganization,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  aggregateOrganization,
  aggregateOrganizations,
} from "../src/converters/aggregators.ts";
import { splitOrganizationIntoObjectsSQL } from "../src/converters/splitters.ts";

describe("Organization Aggregators", () => {
  it("should convert Organization SQL objects into an Organization business object", () => {
    const organization = getMockOrganization();
    const metadataVersion = 1;

    const { attributesSQL, organizationSQL } = splitOrganizationIntoObjectsSQL(
      organization,
      metadataVersion,
    );

    const aggregatedOrganization = aggregateOrganization(
      attributesSQL.map((attribute) => ({
        attribute,
        organization: organizationSQL,
      })),
    );

    expect(aggregatedOrganization).toEqual(
      toExpectOrganization(organization) satisfies Organization,
    );
  });

  it("should convert Organizations SQL objects into Organizations business objects", () => {
    const organization1 = getMockOrganization(0);
    const organization2 = getMockOrganization(1);

    const { attributesSQL: attributesSQL1, organizationSQL: organizationSQL1 } =
      splitOrganizationIntoObjectsSQL(organization1, 1);
    const { attributesSQL: attributesSQL2, organizationSQL: organizationSQL2 } =
      splitOrganizationIntoObjectsSQL(organization2, 1);

    const aggregatedOrganizations = aggregateOrganizations([
      ...attributesSQL1.map((attribute) => ({
        attribute,
        organization: organizationSQL1,
      })),
      ...attributesSQL2.map((attribute) => ({
        attribute,
        organization: organizationSQL2,
      })),
    ]);

    expect(aggregatedOrganizations).toEqual(
      expect.arrayContaining([
        toExpectOrganization(organization1),
        toExpectOrganization(organization2),
      ] satisfies Organization[]),
    );
  });
});
