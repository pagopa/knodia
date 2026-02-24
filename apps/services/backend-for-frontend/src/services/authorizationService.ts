import { KMSClient, SignCommand } from "@aws-sdk/client-kms";
import { UISessionTokenClaims, UserRole } from "@knodia/common-models/auth";
import { unauthorizedError } from "@knodia/fastify-zod-api-commons/models";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";
import z from "zod";

import { config } from "../config/config.ts";

const CognitoPayload = z.object({
  "cognito:groups": z.array(z.string()),
  sub: z.string(),
});

interface CognitoClaims {
  organizationId: string;
  roles: z.infer<typeof UserRole>[];
  sub: string;
}

const b64url = (data: string): string =>
  Buffer.from(data).toString("base64url");

export function authorizationServiceBuilder() {
  const cognitoJwks = createRemoteJWKSet(new URL(config.cognitoJwksUrl));
  const kmsClient = new KMSClient();

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

  return {
    async generateUISessionToken(claims: CognitoClaims): Promise<string> {
      const header = b64url(
        JSON.stringify({
          alg: "RS256",
          kid: config.uiSessionJwt.kid,
          typ: "JWT",
        }),
      );

      const now = Math.floor(Date.now() / 1000);
      const claimsParsed = UISessionTokenClaims.safeParse({
        aud: config.uiSessionJwt.audience,
        exp: now + config.uiSessionJwt.secondsDuration,
        iat: now,
        iss: config.uiSessionJwt.issuer,
        jti: randomUUID(),
        organizationId: claims.organizationId,
        roles: claims.roles,
        sub: claims.sub,
        type: "ui-session",
      });

      if (!claimsParsed.success) {
        throw unauthorizedError("Failed to build ui session token claims");
      }
      const payload = b64url(JSON.stringify(claimsParsed.data));

      const message = `${header}.${payload}`;

      const { Signature } = await kmsClient.send(
        new SignCommand({
          KeyId: `alias/${config.uiSessionJwt.kid}`,
          Message: new TextEncoder().encode(message),
          SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256",
        }),
      );

      if (!Signature) {
        throw unauthorizedError("KMS sign returned no signature");
      }

      const signature = Buffer.from(Signature).toString("base64url");
      return `${message}.${signature}`;
    },

    async validateCognitoToken(token: string): Promise<CognitoClaims> {
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

      return {
        organizationId: orgGroup.slice("org:".length),
        roles,
        sub: cognitoPayload.sub,
      };
    },
  };
}
