import {
  type CompactEservice,
  type Eservice,
  type EserviceVersion,
} from "@knodia/eservice-models";
import { expect } from "vitest";

export function toExpectAPI_Eservice(eservice: CompactEservice) {
  return {
    createdAt: eservice.createdAt.toISOString(),
    description: eservice.description,
    id: eservice.id,
    isConsumerOperatorIdentificationRequired:
      eservice.isConsumerOperatorIdentificationRequired,
    isSignalHubEnabled: eservice.isSignalHubEnabled,
    mode: eservice.mode,
    name: eservice.name,
    producerId: eservice.producerId,
    updatedAt: eservice.updatedAt.toISOString(),
  };
}

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
