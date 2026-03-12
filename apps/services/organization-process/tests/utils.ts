import type { Organization } from "@knodia/organization-models";

import { createInjectAppRequest } from "@knodia/test-commons/fastify";
import { expect } from "vitest";

import { app } from "./setup.ts";

export const injectAppRequest = createInjectAppRequest(() => app);

export const toExpectAPI_Organization = (org: Organization) => ({
  attributes: expect.arrayContaining(org.attributes),
  createdAt: org.createdAt.toISOString(),
  id: org.id,
  name: org.name,
  updatedAt: org.updatedAt.toISOString(),
});
