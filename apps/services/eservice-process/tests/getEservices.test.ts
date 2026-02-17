import { describe, expect, it } from "vitest";

import type { API_Eservices } from "../src/models/api.ts";

import { injectAppRequest } from "./utils.ts";

const getEservices = (query: Record<string, string | string[]>) =>
  injectAppRequest().get("/eservices").query(query);

// TODO: These tests rely on mock data. Update assertions when switching to real data.
describe("GET /eservices (getEservices)", () => {
  it("should return e-services with correct shape and pagination", async () => {
    const response = await getEservices({
      limit: "10",
      offset: "0",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<API_Eservices>();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.length).toBeLessThanOrEqual(10);
    expect(body.pagination).toEqual({
      limit: 10,
      offset: 0,
      total: expect.any(Number),
    });

    const item = body.items[0];
    expect(item).toEqual(
      expect.objectContaining({
        categories: expect.any(Array),
        createdAt: expect.any(String),
        description: expect.objectContaining({ en: expect.any(String) }),
        id: expect.any(String),
        isConsumerOperatorIdentificationRequired: expect.any(Boolean),
        isSignalHubEnabled: expect.any(Boolean),
        mode: expect.stringMatching(/^(PROVIDE_DATA|RECEIVE_DATA)$/),
        name: expect.objectContaining({ en: expect.any(String) }),
        producerId: expect.any(String),
        state: expect.stringMatching(/^(ACTIVE|SUSPENDED|ARCHIVED)$/),
        updatedAt: expect.any(String),
      }),
    );
  });

  it("should paginate results correctly", async () => {
    const firstPage = await getEservices({
      limit: "3",
      offset: "0",
    });
    const secondPage = await getEservices({
      limit: "3",
      offset: "3",
    });

    const firstBody = firstPage.json<API_Eservices>();
    const secondBody = secondPage.json<API_Eservices>();

    expect(firstBody.items).toHaveLength(3);
    expect(secondBody.items).toHaveLength(3);
    expect(firstBody.pagination.total).toBe(secondBody.pagination.total);

    const firstIds = firstBody.items.map((i) => i.id);
    const secondIds = secondBody.items.map((i) => i.id);
    expect(firstIds).not.toEqual(secondIds);
  });

  it("should filter by search query", async () => {
    const response = await getEservices({
      limit: "50",
      offset: "0",
      q: "VAT",
    });

    const body = response.json<API_Eservices>();
    expect(body.items.length).toBeGreaterThan(0);
    expect(
      body.items.every(
        (item) =>
          item.name.en.toLowerCase().includes("vat") ||
          item.description.en.toLowerCase().includes("vat") ||
          item.categories.some((c) => c.code.toLowerCase().includes("vat")),
      ),
    ).toBe(true);
  });

  it("should filter by status", async () => {
    const response = await getEservices({
      limit: "50",
      offset: "0",
      state: ["ACTIVE", "SUSPENDED"],
    });

    const body = response.json<API_Eservices>();
    expect(body.items.length).toBeGreaterThan(0);
    expect(
      body.items.every(
        (item) => item.state === "ACTIVE" || item.state === "SUSPENDED",
      ),
    ).toBe(true);
  });

  it("should filter by mode", async () => {
    const response = await getEservices({
      limit: "50",
      mode: "RECEIVE_DATA",
      offset: "0",
    });

    const body = response.json<API_Eservices>();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((item) => item.mode === "RECEIVE_DATA")).toBe(true);
  });

  it("should sort by name ascending by default", async () => {
    const response = await getEservices({
      limit: "50",
      offset: "0",
    });

    const body = response.json<API_Eservices>();
    const names = body.items.map((i) => i.name.en);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it("should sort by name descending", async () => {
    const response = await getEservices({
      limit: "50",
      offset: "0",
      sortBy: "name",
      sortOrder: "desc",
    });

    const body = response.json<API_Eservices>();
    const names = body.items.map((i) => i.name.en);
    const sorted = [...names].sort((a, b) => b.localeCompare(a));
    expect(names).toEqual(sorted);
  });

  it.each([
    { limit: "abc", offset: "0" },
    { limit: "0", offset: "0" },
    { limit: "51", offset: "0" },
    { limit: "10", offset: "-1" },
    { limit: new Date(), offset: NaN },
    { limit: 9999999, offset: 9999999 },
  ])("should return 400 for invalid pagination params (%o)", async (query) => {
    const response = await getEservices(query as never);
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for invalid mode value", async () => {
    const response = await getEservices({
      limit: "10",
      mode: "InvalidMode",
      offset: "0",
    });
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for invalid sortBy value", async () => {
    const response = await getEservices({
      limit: "10",
      offset: "0",
      sortBy: "invalidField",
    });
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for invalid sortOrder value", async () => {
    const response = await getEservices({
      limit: "10",
      offset: "0",
      sortOrder: "invalidOrder",
    });
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for invalid status value", async () => {
    const response = await getEservices({
      limit: "10",
      offset: "0",
      status: "InvalidStatus",
    });
    expect(response.statusCode).toBe(400);
  });
});
