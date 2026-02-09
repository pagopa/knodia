import type { API_ProducerEservices } from "@knodia/eservice-models/api";

import { describe, expect, it } from "vitest";

import { injectAppRequest } from "./utils.ts";

const getProducerEservices = (query: Record<string, string | string[]>) =>
  injectAppRequest().get("/producer/eservices").query(query);

// TODO: These tests rely on mock data. Update assertions when switching to real data.
describe("GET /producer/eservices (getProducerEservices)", () => {
  it("should return producer e-services with correct shape and pagination", async () => {
    const response = await getProducerEservices({
      limit: "10",
      offset: "0",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<API_ProducerEservices>();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.length).toBeLessThanOrEqual(10);
    expect(body["pagination"]).toEqual({
      limit: 10,
      offset: 0,
      total: expect.any(Number),
    });

    const item = body.items[0];
    expect(item).toEqual(
      expect.objectContaining({
        activeAgreements: expect.any(Number),
        activePurposes: expect.any(Number),
        categories: expect.any(Array),
        id: expect.any(String),
        mode: expect.stringMatching(/^(ProvideData|ReceiveData)$/),
        name: expect.objectContaining({ en: expect.any(String) }),
        status: expect.stringMatching(/^(Active|Suspended|Archived)$/),
      }),
    );
  });

  it("should paginate results correctly", async () => {
    const firstPage = await getProducerEservices({
      limit: "3",
      offset: "0",
    });
    const secondPage = await getProducerEservices({
      limit: "3",
      offset: "3",
    });

    const firstBody = firstPage.json<API_ProducerEservices>();
    const secondBody = secondPage.json<API_ProducerEservices>();

    expect(firstBody.items).toHaveLength(3);
    expect(secondBody.items).toHaveLength(3);
    expect(firstBody["pagination"].total).toBe(secondBody["pagination"].total);

    const firstIds = firstBody.items.map((i) => i.id);
    const secondIds = secondBody.items.map((i) => i.id);
    expect(firstIds).not.toEqual(secondIds);
  });

  it("should filter by search query", async () => {
    const response = await getProducerEservices({
      limit: "50",
      offset: "0",
      q: "VAT",
    });

    const body = response.json<API_ProducerEservices>();
    expect(body.items.length).toBeGreaterThan(0);
    expect(
      body.items.every(
        (item) =>
          item.name.en.toLowerCase().includes("vat") ||
          item.categories.some((c) => c.code.toLowerCase().includes("vat")),
      ),
    ).toBe(true);
  });

  it("should filter by status", async () => {
    const response = await getProducerEservices({
      limit: "50",
      offset: "0",
      status: ["Active", "Suspended"],
    });

    const body = response.json<API_ProducerEservices>();
    expect(body.items.length).toBeGreaterThan(0);
    expect(
      body.items.every(
        (item) => item.status === "Active" || item.status === "Suspended",
      ),
    ).toBe(true);
  });

  it("should filter by mode", async () => {
    const response = await getProducerEservices({
      limit: "50",
      mode: "ReceiveData",
      offset: "0",
    });

    const body = response.json<API_ProducerEservices>();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((item) => item.mode === "ReceiveData")).toBe(true);
  });

  it("should sort by name ascending by default", async () => {
    const response = await getProducerEservices({
      limit: "50",
      offset: "0",
    });

    const body = response.json<API_ProducerEservices>();
    const names = body.items.map((i) => i.name.en);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it("should sort by name descending", async () => {
    const response = await getProducerEservices({
      limit: "50",
      offset: "0",
      sortBy: "name",
      sortOrder: "desc",
    });

    const body = response.json<API_ProducerEservices>();
    const names = body.items.map((i) => i.name.en);
    const sorted = [...names].sort((a, b) => b.localeCompare(a));
    expect(names).toEqual(sorted);
  });

  it.each([
    { limit: "abc", offset: "0" },
    { limit: "0", offset: "0" },
    { limit: "51", offset: "0" },
    { limit: "10", offset: "-1" },
  ])("should return 400 for invalid pagination params (%o)", async (query) => {
    const response = await getProducerEservices(query);
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for invalid mode value", async () => {
    const response = await getProducerEservices({
      limit: "10",
      mode: "InvalidMode",
      offset: "0",
    });
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for invalid sortBy value", async () => {
    const response = await getProducerEservices({
      limit: "10",
      offset: "0",
      sortBy: "invalidField",
    });
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for invalid sortOrder value", async () => {
    const response = await getProducerEservices({
      limit: "10",
      offset: "0",
      sortOrder: "invalidOrder",
    });
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for invalid status value", async () => {
    const response = await getProducerEservices({
      limit: "10",
      offset: "0",
      status: "InvalidStatus",
    });
    expect(response.statusCode).toBe(400);
  });
});
