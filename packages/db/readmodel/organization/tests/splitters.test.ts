import { getMockOrganization } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type {
  OrganizationAttributeSQL,
  OrganizationSQL,
} from "../src/organization.ts";

import { splitOrganizationIntoObjectsSQL } from "../src/converters/splitters.ts";

describe("Organization Splitters", () => {
  it("should split an Organization business object into Organization SQL objects", () => {
    const metadataVersion = 1;
    const organization = getMockOrganization();

    const { attributesSQL, organizationSQL } = splitOrganizationIntoObjectsSQL(
      organization,
      metadataVersion,
    );

    const expectedOrganizationSQL: OrganizationSQL = {
      createdAt: organization.createdAt,
      id: organization.id,
      metadataVersion,
      name: organization.name,
      updatedAt: organization.updatedAt,
    };

    const expectedAttributesSQL: OrganizationAttributeSQL[] =
      organization.attributes.map((attribute) => ({
        code: attribute.code,
        metadataVersion,
        organizationId: organization.id,
        scheme: attribute.scheme,
      }));

    expect(organizationSQL).toEqual(expectedOrganizationSQL);
    expect(attributesSQL).toEqual(
      expect.arrayContaining(expectedAttributesSQL),
    );
  });
});
