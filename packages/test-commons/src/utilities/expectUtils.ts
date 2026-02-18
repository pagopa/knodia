import { type Eservice, type EserviceVersion } from "@knodia/eservice-models";
import { expect } from "vitest";

export function toExpectEservice(eservice: Eservice) {
  return {
    ...eservice,
    categories: expect.arrayContaining(eservice.categories),
    versions: expect.arrayContaining(
      eservice.versions.map(toExpectEserviceVersion),
    ),
  };
}

function toExpectEserviceVersion(eserviceVersion: EserviceVersion) {
  return expect.objectContaining({
    ...eserviceVersion,
    accessTokenAudience: expect.arrayContaining(
      eserviceVersion.accessTokenAudience,
    ),
    requiredAttributes: eserviceVersion.requiredAttributes.map((group) =>
      expect.arrayContaining(group),
    ),
  });
}
