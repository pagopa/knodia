/* eslint-disable max-lines-per-function */
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { type ConsumerKeychainId, generateId } from "@knodia/common-models/ids";
import { getMockClientAssertion } from "@knodia/test-commons/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { API_TokenRequest } from "../src/models/api.ts";

import { app } from "./setup.ts";

const getClientAssertionVerificationDataMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      getClientAssertionVerificationData:
        getClientAssertionVerificationDataMock,
    },
  };
});

describe("POST /token", async () => {
  const VALID_CLIENT_ASSERTION_TYPE =
    "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
  const VALID_GRANT_TYPE = "client_credentials";

  const mockK2KResponse: k2kGatewayApi.ClientAssertionVerificationResponse = {
    consumerAttributes: [
      {
        code: "vc_territorial_units",
        scheme: "nuts1",
      },
      {
        code: "vc_organizational_units",
        scheme: "nuts2",
      },
    ],
    publicKey:
      "mock-public-key" as unknown as k2kGatewayApi.PublicKeyForVerification,
  };

  const consumerKeychainId = generateId<ConsumerKeychainId>();
  const { clientAssertion, clientAssertionJWS, keySet, signClientAssertion } =
    await getMockClientAssertion({
      standardClaimsOverride: {
        aud: ["test-audience-1"],
        iss: consumerKeychainId,
        sub: consumerKeychainId,
      },
    });

  const defaultBody: API_TokenRequest = {
    client_assertion: clientAssertionJWS,
    client_assertion_type: VALID_CLIENT_ASSERTION_TYPE,
    client_id: consumerKeychainId,
    grant_type: VALID_GRANT_TYPE,
  };

  beforeEach(() => {
    getClientAssertionVerificationDataMock.mockReset();
  });

  it("returns a mocked bearer token", async () => {
    getClientAssertionVerificationDataMock.mockResolvedValue({
      data: mockK2KResponse,
    });

    const response = await app.inject({
      method: "POST",
      payload: defaultBody,
      url: "/token",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      mockAccessToken: "mock-access-token",
    });
  });

  it.each([
    ["invalid property", { ...defaultBody, wrongProperty: "wrong" }],
    [
      "invalid client_assertion_type",
      { ...defaultBody, client_assertion_type: "InvalidClientAssertionType" },
    ],
    ["invalid grant_type", { ...defaultBody, grant_type: "InvalidGrantType" }],
    [
      "invalid client_assertion format",
      { ...defaultBody, client_assertion: "InvalidClientAssertion" },
    ],
    [
      "invalid client_id",
      {
        ...defaultBody,
        client_id: "InvalidConsumerKeychainId",
      },
    ],
    ["empty body", {}],
  ])(
    "should return 400 if the body is not correctly formatted - %s",
    async (_label, body) => {
      const response = await app.inject({
        method: "POST",
        payload: body,
        url: "/token",
      });
      expect(response.statusCode).toBe(400);
    },
  );

  it.each([
    [
      "invalid claim in client_assertion headers",
      {
        ...clientAssertion,
        headers: {
          ...clientAssertion.headers,
          wrong_claim: "wrong",
        },
      },
    ],
    [
      "invalid claim in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          wrong_claim: "wrong",
        },
      },
    ],
    [
      "invalid aud claim in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          aud: ["invalid-audience"],
        },
      },
    ],
    [
      "missing aud claim in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          aud: undefined,
        },
      },
    ],
    [
      "missing exp claim in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          exp: undefined,
        },
      },
    ],
    [
      "missing iat claim in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          iat: undefined,
        },
      },
    ],
    [
      "iss does not match client_id",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          iss: generateId<ConsumerKeychainId>(),
        },
      },
    ],
    [
      "invalid iss format in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          iss: "InvalidIssFormat",
        },
      },
    ],
    [
      "invalid kid format in client_assertion headers",
      {
        ...clientAssertion,
        headers: {
          ...clientAssertion.headers,
          kid: "InvalidKidFormat+",
        },
      },
    ],
    [
      "invalid purpose_id format in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          purpose_id: "InvalidPurposeIdFormat",
        },
      },
    ],
    [
      "sub does not match client_id",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          sub: generateId(),
        },
      },
    ],
    [
      "invalid sub format in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          sub: "InvalidSubFormat",
        },
      },
    ],
    [
      "missing iss claim in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          iss: undefined,
        },
      },
    ],
    [
      "missing jti claim in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          jti: undefined,
        },
      },
    ],
    [
      "missing kid claim in client_assertion headers",
      {
        ...clientAssertion,
        headers: {
          ...clientAssertion.headers,
          kid: undefined,
        },
      },
    ],
    [
      "missing purpose_id in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          purpose_id: undefined,
        },
      },
    ],
    [
      "missing sub claim in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          sub: undefined,
        },
      },
    ],
    [
      "missing typ claim in client_assertion headers",
      {
        ...clientAssertion,
        headers: {
          ...clientAssertion.headers,
          typ: undefined,
        },
      },
    ],
    [
      "invalid typ claim in client_assertion headers",
      {
        ...clientAssertion,
        headers: {
          ...clientAssertion.headers,
          typ: "InvalidTypFormat",
        },
      },
    ],
  ])(
    "should return 400 if the client assertion has invalid claims - %s",
    async (_label, clientAssertion) => {
      const clientAssertionJWS = await signClientAssertion({
        clientAssertion,
        keySet,
      });

      const response = await app.inject({
        method: "POST",
        payload: {
          ...defaultBody,
          client_assertion: clientAssertionJWS,
        },
        url: "/token",
      });
      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 500 when the k2k gateway call fails", async () => {
    getClientAssertionVerificationDataMock.mockRejectedValue(
      new Error("k2k gateway error"),
    );

    const response = await app.inject({
      method: "POST",
      payload: defaultBody,
      url: "/token",
    });

    expect(response.statusCode).toBe(500);
  });
});
