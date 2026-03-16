import type { Purpose } from "@knodia/purpose-models";

import { createInjectAppRequest } from "@knodia/test-commons/fastify";

import type { API_Purpose } from "../src/models/api.ts";
import { toAPI_Purpose } from "../src/models/apiConverter.ts";

import { app } from "./setup.ts";

export const injectAppRequest = createInjectAppRequest(() => app);

export function toExpectAPI_Purpose(purpose: Purpose): API_Purpose {
  return toAPI_Purpose(purpose);
}
