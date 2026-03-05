import { requestContext } from "@fastify/request-context";
import { generateId } from "@knodia/common-models/ids";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { CORRELATION_ID_HEADER } from "../../src/models/headers.ts";
import { healthRouterUrl } from "../../src/routers/healthRouter.ts";
import {
  createFastifyApp,
  requireCorrelationIdHeaderPlugin,
} from "../../src/utils/fastify.ts";
import { docsRoutePrefix } from "../../src/utils/openapi-zod-plugin/openapiZodPlugin.ts";
import { makeApiProblemBuilder } from "../../src/utils/problemBuilder.ts";

const makeApiProblem = makeApiProblemBuilder(
  {},
  { serviceName: "eservice-process" },
);

const buildTestApp = () =>
  createFastifyApp({
    fastifyOptions: {
      openapi: { info: { title: "Test", version: "0.0.0" } },
    },
    loggerConfig: { isProduction: false, logLevel: "silent", nodeEnv: "test" },
    makeApiProblem,
    serviceName: "eservice-process",
  });

const docsTestRoute = `${docsRoutePrefix}/test`;

describe("requireCorrelationIdHeaderPlugin", () => {
  let app: ReturnType<typeof buildTestApp>;

  beforeAll(async () => {
    app = buildTestApp();

    // Public routes — outside the encapsulated context
    app.get(healthRouterUrl, async () => ({ ok: true }));
    app.get(docsTestRoute, async () => ({ ok: true }));

    // Protected routes — requireCorrelationIdHeaderPlugin scoped via encapsulation
    app.register(async (protectedApp) => {
      protectedApp.register(requireCorrelationIdHeaderPlugin, {
        makeApiProblem,
      });
      protectedApp.get("/protected", async () => ({
        correlationId: requestContext.get("correlationId"),
      }));
    });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("does not require the header for the health status route", async () => {
    const response = await app.inject({
      method: "GET",
      url: healthRouterUrl,
    });

    expect(response.statusCode).toBe(200);
  });

  it("does not require the header for routes under the /docs prefix", async () => {
    const response = await app.inject({
      method: "GET",
      url: docsTestRoute,
    });

    expect(response.statusCode).toBe(200);
  });

  it("rejects requests without the correlation ID header on protected routes", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/protected",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toContain(CORRELATION_ID_HEADER);
  });

  it("allows requests with the correlation ID header on protected routes", async () => {
    const response = await app.inject({
      headers: { [CORRELATION_ID_HEADER]: generateId() },
      method: "GET",
      url: "/protected",
    });

    expect(response.statusCode).toBe(200);
  });

  it("overrides the auto-generated correlationId with the header value", async () => {
    const headerCorrelationId = generateId();

    const response = await app.inject({
      headers: { [CORRELATION_ID_HEADER]: headerCorrelationId },
      method: "GET",
      url: "/protected",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ correlationId: headerCorrelationId });
  });
});

describe("correlation ID header injection prevention", () => {
  let app: ReturnType<typeof buildTestApp>;

  beforeAll(async () => {
    // Simulates a frontier service (BFF, k2k-gateway):
    // no requireCorrelationIdHeaderPlugin registered
    app = buildTestApp();

    app.get("/endpoint", async () => ({
      correlationId: requestContext.get("correlationId"),
    }));

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("ignores the correlation ID header — always uses a fresh generated ID", async () => {
    const injectedId = "attacker-injected-id";

    const response = await app.inject({
      headers: { [CORRELATION_ID_HEADER]: injectedId },
      method: "GET",
      url: "/endpoint",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().correlationId).not.toBe(injectedId);
  });
});
