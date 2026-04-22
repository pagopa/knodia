import axios, { type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import { stripContentTypeOnBodylessRequests } from "../src/stripContentTypeOnBodylessRequests.ts";

const buildCapturingInstance = () => {
  const captured: { config?: InternalAxiosRequestConfig } = {};
  const instance = axios.create({
    adapter: async (config) => {
      captured.config = config;
      return {
        config,
        data: null,
        headers: {},
        status: 200,
        statusText: "OK",
      };
    },
  });
  stripContentTypeOnBodylessRequests(instance);
  return { captured, instance };
};

const getContentType = (config: InternalAxiosRequestConfig | undefined) =>
  config?.headers.get("Content-Type");

describe("stripContentTypeOnBodylessRequests", () => {
  it("strips Content-Type on bodyless POST", async () => {
    const { captured, instance } = buildCapturingInstance();
    await instance.post("/foo");
    expect(getContentType(captured.config)).toBeFalsy();
  });

  it("strips Content-Type on bodyless PUT", async () => {
    const { captured, instance } = buildCapturingInstance();
    await instance.put("/foo");
    expect(getContentType(captured.config)).toBeFalsy();
  });

  it("strips Content-Type on bodyless PATCH", async () => {
    const { captured, instance } = buildCapturingInstance();
    await instance.patch("/foo");
    expect(getContentType(captured.config)).toBeFalsy();
  });

  it("treats explicit null body as bodyless", async () => {
    const { captured, instance } = buildCapturingInstance();
    await instance.post("/foo", null);
    expect(getContentType(captured.config)).toBeFalsy();
  });

  it("keeps Content-Type on POST with a JSON body", async () => {
    const { captured, instance } = buildCapturingInstance();
    await instance.post(
      "/foo",
      { hello: "world" },
      { headers: { "Content-Type": "application/json" } },
    );
    expect(getContentType(captured.config)).toBe("application/json");
  });

  it("leaves Content-Type alone on GET even with no body", async () => {
    const { captured, instance } = buildCapturingInstance();
    await instance.get("/foo", {
      headers: { "Content-Type": "application/xml" },
    });
    expect(getContentType(captured.config)).toBe("application/xml");
  });

  it("leaves Content-Type alone on DELETE even with no body", async () => {
    const { captured, instance } = buildCapturingInstance();
    await instance.delete("/foo", {
      headers: { "Content-Type": "application/xml" },
    });
    expect(getContentType(captured.config)).toBe("application/xml");
  });
});
