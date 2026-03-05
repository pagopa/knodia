import type { FastifyInstance } from "fastify";

import { generateId } from "@knodia/common-models/ids";

import { createTestTokenPayload, type TestToken } from "../auth/auth.ts";

export function createInjectAppRequest(getApp: () => FastifyInstance) {
  return (spec: TestToken) =>
    getApp().inject().headers({
      authorization: `Bearer ${createTestTokenPayload(spec)}`,
      "x-correlation-id": generateId(),
    });
}
