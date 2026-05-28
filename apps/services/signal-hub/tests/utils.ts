import type {
  API_Problem,
  ApiError,
} from "@knodia/fastify-zod-api-commons/models";

import { signalHubSignal } from "@knodia/db-signal-hub";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";
import { expect } from "vitest";

import { app, signalHubDb } from "./setup.ts";

export const injectAppRequest = createInjectAppRequest(() => app);

export function checkErrorDetail<T>(
  apiProblem: API_Problem,
  error: ApiError<T>,
) {
  expect(toErrorDetail(apiProblem)).toEqual(toErrorDetail(error));
}

export async function getAllSignals() {
  return await signalHubDb
    .select()
    .from(signalHubSignal)
    .orderBy(signalHubSignal.id);
}

function toErrorDetail<T>(error: API_Problem | ApiError<T>) {
  return error.errors?.[0]?.detail;
}
