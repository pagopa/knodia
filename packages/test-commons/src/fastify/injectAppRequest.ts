import type { FastifyInstance } from "fastify";

import { generateId } from "@knodia/common-models/ids";

import { createTestTokenPayload, type TestToken } from "../auth/auth.ts";

export function createInjectAppRequest(app: FastifyInstance) {
  return (spec: TestToken) =>
    app.inject().headers({
      authorization: `Bearer ${createTestTokenPayload(spec)}`,
      "x-correlation-id": generateId(),
    });
}
