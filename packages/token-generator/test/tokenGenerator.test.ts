/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { NonEmptyArray } from "@knodia/common-models/types";

import { type SignCommand } from "@aws-sdk/client-kms";
import { unsafeBrandId, unsafeBrandUserId } from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import { tokenGeneratorBuilder } from "../src/tokenGenerator.ts";
import { kmsSendMock, testKmsClient } from "./utils.ts";

function decodeB64url(s: string): unknown {
  return JSON.parse(Buffer.from(s, "base64url").toString());
}

const KID = "some-fake-key-id";
const SECONDS_DURATION = 600;
const generator = tokenGeneratorBuilder(testKmsClient);

const testCases = [
  {
    expectedPayload: {
      aud: "my-audience",
      iss: "my-issuer",
      sub: "my-service",
      type: "internal",
    },
    generate: () =>
      generator.generateInternalToken({
        audience: "my-audience",
        issuer: "my-issuer",
        kid: KID,
        secondsDuration: SECONDS_DURATION,
        subject: "my-service",
      }),
    name: "generateInternalToken",
  },
  {
    expectedPayload: {
      aud: "my-audience",
      iss: "my-issuer",
      organizationId: "550e8400-e29b-41d4-a716-446655440000",
      roles: ["administrative"],
      sub: "660e8400-e29b-41d4-a716-446655440000",
      type: "ui-session",
    },
    generate: () =>
      generator.generateUISessionToken({
        audience: "my-audience",
        issuer: "my-issuer",
        kid: KID,
        organizationId: unsafeBrandId("550e8400-e29b-41d4-a716-446655440000"),
        roles: ["administrative"] as NonEmptyArray<"administrative">,
        secondsDuration: SECONDS_DURATION,
        subject: unsafeBrandUserId("660e8400-e29b-41d4-a716-446655440000"),
      }),
    name: "generateUISessionToken",
  },
] as const;

describe.each(testCases)("$name", ({ expectedPayload, generate }) => {
  it("returns a structured token with a valid signed JWT", async () => {
    const result = await generate();

    // Structured fields
    expect(result.type).toBe(expectedPayload.type);
    expect(result.payload).toMatchObject(expectedPayload);
    expect(result.payload.exp).toBe(result.payload.iat + SECONDS_DURATION);

    // JWT structure
    const parts = result.serialized.split(".");
    expect(parts).toHaveLength(3);
    expect(result.header).toBe(parts[0]);
    expect(decodeB64url(parts[0]!)).toMatchObject({
      alg: "RS256",
      kid: KID,
      typ: "at+jwt",
      use: "sig",
    });
    expect(decodeB64url(parts[1]!)).toMatchObject(result.payload);

    // KMS interaction
    expect(kmsSendMock).toHaveBeenCalledOnce();
    const command = kmsSendMock.mock.calls[0]![0] as SignCommand;
    expect(command.input).toMatchObject({
      KeyId: KID,
      SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256",
    });
  });

  it("throws when KMS returns no signature", async () => {
    kmsSendMock.mockResolvedValueOnce({ Signature: undefined });

    await expect(generate()).rejects.toThrow("KMS sign returned no signature");
  });
});
