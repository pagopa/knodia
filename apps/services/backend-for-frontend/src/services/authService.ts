import { UserRole } from "@knodia/common-models/auth";
import { OrganizationId, UserId } from "@knodia/common-models/ids";
import { NonEmptyArray } from "@knodia/common-models/types";
import { unauthorizedError } from "@knodia/fastify-zod-api-commons/models";
import { tokenGeneratorBuilder } from "@knodia/token-generator";
import { createRemoteJWKSet, jwtVerify } from "jose";
import z from "zod";

import { config } from "../config/config.ts";

const CognitoPayload = z.object({
  "cognito:groups": NonEmptyArray(z.string()),
  sub: z.string(),
});

const ClaimsFromCognito = z.object({
  organizationId: OrganizationId,
  roles: NonEmptyArray(UserRole),
  sub: UserId,
});
type ClaimsFromCognito = z.infer<typeof ClaimsFromCognito>;

export function authServiceBuilder() {
  const cognitoJwks = createRemoteJWKSet(new URL(config.cognitoJwksUrl));

  const tokenGenerator = tokenGeneratorBuilder();

  async function verifyCognitoJwt(token: string): Promise<unknown> {
    try {
      const { payload } = await jwtVerify(token, cognitoJwks, {
        algorithms: ["RS256"],
        issuer: config.cognitoIssuer,
      });
      return payload;
    } catch {
      throw unauthorizedError("Cognito token verification failed");
    }
  }

  async function validateCognitoToken(
    token: string,
  ): Promise<ClaimsFromCognito> {
    const rawPayload = await verifyCognitoJwt(token);

    const payloadParsed = CognitoPayload.safeParse(rawPayload);
    if (!payloadParsed.success) {
      throw unauthorizedError("Invalid Cognito token payload");
    }

    const cognitoPayload = payloadParsed.data;
    const groups = cognitoPayload["cognito:groups"];

    const roles = groups
      .filter((g) => g.startsWith("role:"))
      .flatMap((g) => {
        const parsed = UserRole.safeParse(g.slice("role:".length));
        return parsed.success ? [parsed.data] : [];
      });
    const orgGroup = groups.find((g) => g.startsWith("org:"));

    if (!orgGroup) {
      throw unauthorizedError("Missing organization claim in cognito token");
    }

    if (roles.length === 0) {
      throw unauthorizedError("Missing role claims in cognito token");
    }

    const claimsParsed = ClaimsFromCognito.safeParse({
      organizationId: orgGroup.slice("org:".length),
      roles: roles,
      sub: cognitoPayload.sub,
    });

    if (!claimsParsed.success) {
      throw unauthorizedError("Invalid claims in cognito token");
    }

    return claimsParsed.data;
  }

  return {
    async generateUISessionToken(cognitoToken: string): Promise<string> {
      const cognitoClaims = await validateCognitoToken(cognitoToken);

      const token = await tokenGenerator.generateUISessionToken({
        ...config.uiSessionJwt,
        organizationId: cognitoClaims.organizationId,
        roles: cognitoClaims.roles,
        sub: cognitoClaims.sub,
      });
      return token.serialized;
    },
  };
}
