import type { Purpose } from "@knodia/purpose-models";

import { createInjectAppRequest } from "@knodia/test-commons/fastify";

import type { API_Purpose } from "../src/models/api.ts";

import { app } from "./setup.ts";

export const injectAppRequest = createInjectAppRequest(() => app);

export function toExpectAPI_Purpose(purpose: API_Purpose | Purpose) {
  return {
    // formAnswers is intentionally excluded — it can be retrieved via a separate route
    consumer: purpose.consumer,
    createdAt:
      typeof purpose.createdAt === "string"
        ? purpose.createdAt
        : purpose.createdAt.toISOString(),
    dailyCalls: purpose.dailyCalls,
    description: purpose.description,
    eserviceId: purpose.eserviceId,
    id: purpose.id,
    name: purpose.name,
    state: purpose.state,
    updatedAt:
      typeof purpose.updatedAt === "string"
        ? purpose.updatedAt
        : purpose.updatedAt.toISOString(),
  };
}
