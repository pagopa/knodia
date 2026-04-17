import type { FastifyInstance } from "fastify";

import axios, { AxiosError } from "axios";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import z from "zod";

import { buildTestApp } from "../mock/buildTestApp.ts";

/**
 * These tests use a real TCP listener (app.listen) instead of fastify.inject()
 * because inject() bypasses the HTTP layer and content-type parser gate entirely,
 * hiding 415 FST_ERR_CTP_INVALID_MEDIA_TYPE errors that happen with real clients.
 */
describe("bodyless POST content-type handling (wire-level)", () => {
  let app: FastifyInstance;
  let baseUrl: string;
  let lastHeaders: Record<string, string | undefined> = {};

  beforeAll(async () => {
    app = buildTestApp();

    app.post("/bodyless", async (req) => {
      lastHeaders = {
        "content-length": req.raw.headers["content-length"],
        "content-type": req.raw.headers["content-type"],
        "transfer-encoding": req.raw.headers["transfer-encoding"],
      };
      return { ok: true };
    });

    app.route({
      handler: (_req, res) => res.send({ ok: true }),
      method: "POST",
      schema: {
        body: z.strictObject({ foo: z.string() }),
      },
      url: "/withRequiredBody",
    });

    const address = await app.listen({ host: "127.0.0.1", port: 0 });
    baseUrl = address;
  });

  afterAll(async () => {
    await app.close();
  });

  it("accepts Node.js fetch() with method POST and no body", async () => {
    const res = await fetch(`${baseUrl}/bodyless`, { method: "POST" });
    expect(res.status).toBe(200);

    expect(lastHeaders["content-type"]).toBeUndefined();
  });

  it("accepts axios.post() with default headers (form-urlencoded)", async () => {
    const res = await axios.post(`${baseUrl}/bodyless`, undefined);
    expect(res.status).toBe(200);

    // Axios sends this content type even with no data
    expect(lastHeaders["content-type"]).toBe(
      "application/x-www-form-urlencoded",
    );
  });

  it("accepts axios.post() with explicit Content-Type: application/json and empty body", async () => {
    const res = await axios.post(`${baseUrl}/bodyless`, undefined, {
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(200);

    expect(lastHeaders["content-type"]).toBe("application/json");
  });

  it.each([
    {
      label: "fetch POST with no body and no content-type",
      send: () => fetch(`${baseUrl}/withRequiredBody`, { method: "POST" }),
    },
    {
      label: "axios.post() with default headers (form-urlencoded)",
      send: () => axios.post(`${baseUrl}/withRequiredBody`, undefined),
    },
    {
      label:
        "axios.post() with explicit Content-Type: application/json and empty body",
      send: () =>
        axios.post(`${baseUrl}/withRequiredBody`, undefined, {
          headers: { "Content-Type": "application/json" },
        }),
    },
  ])(
    "returns 400 on routes requiring a body when called empty ($label)",
    async ({ send }) => {
      const status = await send()
        .then((res) => ("status" in res ? res.status : undefined))
        .catch((error: unknown) =>
          error instanceof AxiosError ? error.response?.status : undefined,
        );

      expect(status).toBe(400);
    },
  );
});
