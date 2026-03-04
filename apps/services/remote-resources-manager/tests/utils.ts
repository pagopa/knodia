import type { TestToken } from "@knodia/test-commons/auth";

import { generateId } from "@knodia/common-models/ids";
import {
  AUTHORIZATION_HEADER,
  CORRELATION_ID_HEADER,
} from "@knodia/fastify-zod-api-commons/models";
import { createTestTokenPayload } from "@knodia/test-commons/auth";

import { app } from "./setup.ts";

export function injectAppRequest(spec: TestToken) {
  return app.inject().headers({
    [AUTHORIZATION_HEADER]: `Bearer ${createTestTokenPayload(spec)}`,
    [CORRELATION_ID_HEADER]: generateId(),
  });
}
