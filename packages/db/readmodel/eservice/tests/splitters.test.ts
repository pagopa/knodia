import { getMockEservice } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type {
  EserviceCategorySQL,
  EserviceInterfaceSQL,
  EserviceSQL,
  EserviceVersionRequiredAttributeSQL,
  EserviceVersionSQL,
} from "../src/eservice.ts";

import { splitEserviceIntoObjectsSQL } from "../src/converters/splitters.ts";

describe("E-service Splitters", () => {
  it("should split an E-service business object into E-service SQL objects", () => {
    const metadataVersion = 1;
    const eservice = getMockEservice();

    const {
      eserviceCategoriesSQL,
      eserviceInterfacesSQL,
      eserviceSQL,
      eserviceVersionRequiredAttributesSQL,
      eserviceVersionsSQL,
    } = splitEserviceIntoObjectsSQL(eservice, metadataVersion);

    const expectedEserviceSQL: EserviceSQL = {
      createdAt: eservice.createdAt,
      description: eservice.description,
      id: eservice.id,
      isConsumerOperatorIdentificationRequired:
        eservice.isConsumerOperatorIdentificationRequired,
      isSignalHubEnabled: eservice.isSignalHubEnabled,
      metadataVersion,
      mode: eservice.mode,
      name: eservice.name,
      producerId: eservice.producerId,
      templateId: null,
      templateKnodeId: null,
      updatedAt: eservice.updatedAt,
    };

    const expectedEserviceCategoriesSQL: EserviceCategorySQL[] =
      eservice.categories.map((category) => ({
        code: category.code,
        eserviceId: eservice.id,
        metadataVersion,
        scheme: category.scheme,
      }));

    const expectedEserviceVersionsSQL: EserviceVersionSQL[] =
      eservice.versions.map((eserviceVersion) => ({
        accessTokenAudience: eserviceVersion.accessTokenAudience,
        accessTokenDuration: eserviceVersion.accessTokenDuration,
        accessTokenType: eserviceVersion.accessTokenType,
        createdAt: eserviceVersion.createdAt,
        eserviceId: eservice.id,
        id: eserviceVersion.id,
        maxDailyCallsPerConsumer: eserviceVersion.maxDailyCallsPerConsumer,
        maxDailyCallsPerKnode: eserviceVersion.maxDailyCallsPerKnode,
        metadataVersion,
        state: eserviceVersion.state,
        updatedAt: eserviceVersion.updatedAt,
        versionNumber: eserviceVersion.versionNumber,
      }));

    const expectedEserviceInterfacesSQL: EserviceInterfaceSQL[] =
      eservice.versions.flatMap((eserviceVersion) => ({
        checksum: eserviceVersion.interfaceDocument.checksum,
        contentType: eserviceVersion.interfaceDocument.contentType,
        createdAt: eserviceVersion.interfaceDocument.createdAt,
        eserviceId: eservice.id,
        eserviceVersionId: eserviceVersion.id,
        id: eserviceVersion.interfaceDocument.id,
        metadataVersion,
        name: eserviceVersion.interfaceDocument.name,
        path: eserviceVersion.interfaceDocument.path,
        prettyName: eserviceVersion.interfaceDocument.prettyName,
        updatedAt: eserviceVersion.interfaceDocument.updatedAt,
      }));

    const expectedRequireAttributesSQL: EserviceVersionRequiredAttributeSQL[] =
      eservice.versions.flatMap((eserviceVersion) =>
        eserviceVersion.requiredAttributes.flatMap((group, groupId) =>
          group.map((attribute) => ({
            code: attribute.code,
            eserviceId: eservice.id,
            eserviceVersionId: eserviceVersion.id,
            groupId,
            metadataVersion,
            scheme: attribute.scheme,
          })),
        ),
      );

    expect(eserviceSQL).toEqual(expectedEserviceSQL);
    expect(eserviceCategoriesSQL).toEqual(
      expect.arrayContaining(expectedEserviceCategoriesSQL),
    );
    expect(eserviceVersionsSQL).toEqual(
      expect.arrayContaining(expectedEserviceVersionsSQL),
    );
    expect(eserviceInterfacesSQL).toEqual(
      expect.arrayContaining(expectedEserviceInterfacesSQL),
    );
    expect(eserviceVersionRequiredAttributesSQL).toEqual(
      expect.arrayContaining(expectedRequireAttributesSQL),
    );
  });
});
