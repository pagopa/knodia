import type { RequestContextData } from "@fastify/request-context";

import { type CorrelationId, generateId } from "@knodia/common-models/ids";
import {
  getTestExternalUISessionTokenClaims,
  getTestInternalTokenClaims,
  getTestUISessionTokenClaims,
} from "@knodia/test-commons/auth";
import { createTestLogger } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  type ExternalUISessionAuthData,
  extractAuthDataFromToken,
  type InternalAuthData,
  type UISessionAuthData,
} from "../../src/auth/authData.ts";
import { validateAuthorization } from "../../src/auth/authorization.ts";
import {
  forbiddenError,
  unauthorizedError,
} from "../../src/models/errors/errors.ts";

const internalAuthData = extractAuthDataFromToken(getTestInternalTokenClaims());
const adminUISessionAuthData = extractAuthDataFromToken(
  getTestUISessionTokenClaims({ roles: ["administrative"] }),
);
const technicalUISessionAuthData = extractAuthDataFromToken(
  getTestUISessionTokenClaims({ roles: ["technical"] }),
);
const externalUISessionAuthData = extractAuthDataFromToken(
  getTestExternalUISessionTokenClaims(),
);

const { logger } = createTestLogger();

function buildCtx(
  authData: RequestContextData["authData"],
): RequestContextData {
  return {
    authData,
    correlationId: generateId<CorrelationId>(),
    logger,
  };
}

describe("validateAuthorization", () => {
  it("throws unauthorized (401) when authData is undefined", () => {
    const ctx = buildCtx(undefined);

    expect(() =>
      validateAuthorization(ctx, [{ tokenType: "internal" }]),
    ).toThrow(unauthorizedError("No authorization data available"));
  });

  describe("internal token", () => {
    it("succeeds when internal is admitted", () => {
      const ctx = buildCtx(internalAuthData);

      const result = validateAuthorization(ctx, [{ tokenType: "internal" }]);
      const resultAuthData: InternalAuthData = result.authData;
      // ^ Type narrowing check: result.authData is InternalAuthData
      expect(resultAuthData).toEqual(internalAuthData);
      expect(result.authData.tokenType).toBe("internal");
    });

    it("throws forbidden (403) when internal is not admitted", () => {
      const ctx = buildCtx(internalAuthData);

      expect(() =>
        validateAuthorization(ctx, [
          { tokenType: "ui-session", userRoles: ["administrative"] },
        ]),
      ).toThrow(
        forbiddenError(`Invalid token type "internal" for this operation`),
      );
    });
  });

  describe("ui-session token", () => {
    it("succeeds when user role matches", () => {
      const ctx = buildCtx(adminUISessionAuthData);

      const result = validateAuthorization(ctx, [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const resultAuthData: UISessionAuthData = result.authData;
      // ^ Type narrowing check: result.authData is UISessionAuthData
      expect(resultAuthData).toEqual(adminUISessionAuthData);
      expect(result.authData.tokenType).toBe("ui-session");
      expect(result.authData.userRoles).toContain("administrative");
    });

    it("throws forbidden (403) when user role does not match", () => {
      const ctx = buildCtx(technicalUISessionAuthData);

      expect(() =>
        validateAuthorization(ctx, [
          { tokenType: "ui-session", userRoles: ["administrative"] },
        ]),
      ).toThrow(
        forbiddenError(
          `Invalid roles ${JSON.stringify(["technical"])} for this operation`,
        ),
      );
    });

    it("succeeds when multiple user roles are admitted and one matches", () => {
      const ctx = buildCtx(technicalUISessionAuthData);

      const result = validateAuthorization(ctx, [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const resultAuthData: UISessionAuthData = result.authData;
      // ^ Type narrowing check: result.authData is UISessionAuthData
      expect(resultAuthData).toEqual(technicalUISessionAuthData);
      expect(result.authData.tokenType).toBe("ui-session");
      expect(result.authData.userRoles).toContain("technical");
    });

    it("throws forbidden (403) when ui-session token type is not admitted", () => {
      const ctx = buildCtx(adminUISessionAuthData);

      expect(() =>
        validateAuthorization(ctx, [{ tokenType: "internal" }]),
      ).toThrow(
        forbiddenError(`Invalid token type "ui-session" for this operation`),
      );
    });
  });

  describe("external-ui-session token", () => {
    it("succeeds when scope matches", () => {
      const ctx = buildCtx(externalUISessionAuthData);

      const result = validateAuthorization(ctx, [
        { scope: "agreement-activation", tokenType: "external-ui-session" },
      ]);

      const resultAuthData: ExternalUISessionAuthData = result.authData;
      expect(resultAuthData).toEqual(externalUISessionAuthData);
      expect(result.authData.tokenType).toBe("external-ui-session");
    });

    it("throws forbidden (403) when external-ui-session token type is not admitted", () => {
      const ctx = buildCtx(externalUISessionAuthData);

      expect(() =>
        validateAuthorization(ctx, [{ tokenType: "internal" }]),
      ).toThrow(
        forbiddenError(
          `Invalid token type "external-ui-session" for this operation`,
        ),
      );
    });
  });

  it("returns AuthorizedContext with correlationId and logger", () => {
    const ctx = buildCtx(internalAuthData);

    const result = validateAuthorization(ctx, [{ tokenType: "internal" }]);

    expect(result.correlationId).toBe(ctx.correlationId);
    expect(result.logger).toBe(ctx.logger);
  });
});

describe("validateAuthorization with mixed rules", () => {
  it("admits internal token", () => {
    const ctx = buildCtx(internalAuthData);

    const result = validateAuthorization(ctx, [
      { tokenType: "internal" },
      { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
    ]);
    const resultAuthData: InternalAuthData | UISessionAuthData =
      result.authData;
    // ^ Type narrowing check: result.authData is InternalAuthData | UISessionAuthData
    expect(resultAuthData).toEqual(internalAuthData);
    expect(result.authData.tokenType).toBe("internal");
  });

  it("admits ui-session token with matching admin role", () => {
    const ctx = buildCtx(adminUISessionAuthData);

    const result = validateAuthorization(ctx, [
      { tokenType: "internal" },
      { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
    ]);
    const resultAuthData: InternalAuthData | UISessionAuthData =
      result.authData;
    // ^ Type narrowing check: result.authData is InternalAuthData | UISessionAuthData
    expect(resultAuthData).toEqual(adminUISessionAuthData);
    expect(
      result.authData.tokenType === "ui-session" && result.authData.userRoles,
    ).toContain("administrative");
  });

  it("throws forbidden (403) when ui-session role does not match mixed rules", () => {
    const ctx = buildCtx(adminUISessionAuthData);

    expect(() =>
      validateAuthorization(ctx, [
        { tokenType: "internal" },
        { tokenType: "ui-session", userRoles: ["technical"] },
      ]),
    ).toThrow(
      forbiddenError(
        `Invalid roles ${JSON.stringify(["administrative"])} for this operation`,
      ),
    );
  });

  it("admits ui-session token with matching technical role", () => {
    const ctx = buildCtx(technicalUISessionAuthData);

    const result = validateAuthorization(ctx, [
      { tokenType: "internal" },
      { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
    ]);
    const resultAuthData: InternalAuthData | UISessionAuthData =
      result.authData;
    // ^ Type narrowing check: result.authData is InternalAuthData | UISessionAuthData
    expect(resultAuthData).toEqual(technicalUISessionAuthData);
    expect(
      result.authData.tokenType === "ui-session" && result.authData.userRoles,
    ).toContain("technical");
  });

  it("admits external-ui-session token alongside internal and ui-session rules", () => {
    const ctx = buildCtx(externalUISessionAuthData);

    const result = validateAuthorization(ctx, [
      { tokenType: "internal" },
      { tokenType: "ui-session", userRoles: ["administrative"] },
      { scope: "agreement-activation", tokenType: "external-ui-session" },
    ]);
    const resultAuthData:
      | ExternalUISessionAuthData
      | InternalAuthData
      | UISessionAuthData = result.authData;
    // ^ Type narrowing check: result.authData is the union of all three
    expect(resultAuthData).toEqual(externalUISessionAuthData);
    expect(result.authData.tokenType).toBe("external-ui-session");
  });
});
