import { KMSClient, SignCommand } from "@aws-sdk/client-kms";
import { UISessionTokenClaims, UserRole } from "@knodia/common-models/auth";
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

export function authorizationServiceBuilder(kmsClient: KMSClient) {
  const cognitoJwks = createRemoteJWKSet(new URL(config.cognitoJwksUrl));

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
      const tokenClaims = UISessionTokenClaims.parse({
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
      const payload = b64url(JSON.stringify(tokenClaims));

      const message = `${header}.${payload}`;

      const { Signature } = await kmsClient.send(
        new SignCommand({
          KeyId: `alias/${config.uiSessionJwt.kid}`,
          Message: new TextEncoder().encode(message),
          SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256",
        }),
      );

      if (!Signature) {
        throw new Error("KMS sign returned no signature");
      }

      const signature = Buffer.from(Signature).toString("base64url");
      return `${message}.${signature}`;
    },

    async validateCognitoToken(token: string): Promise<CognitoClaims> {
      const { payload: rawPayload } = await jwtVerify(token, cognitoJwks, {
        algorithms: ["RS256"],
        issuer: config.cognitoIssuer,
      });

      const cognitoPayload = CognitoPayload.parse(rawPayload);
      const groups = cognitoPayload["cognito:groups"];

      const roles = groups
        .filter((g) => g.startsWith("role:"))
        .map((g) => UserRole.parse(g.slice("role:".length)));
      const orgGroup = groups.find((g) => g.startsWith("org:"));

      if (!orgGroup) {
        throw new Error("Missing organization claim in token");
      }

      if (roles.length === 0) {
        throw new Error("Missing role claims in token");
      }

      return {
        organizationId: orgGroup.slice("org:".length),
        roles,
        sub: cognitoPayload.sub,
      };
    },
  };
}

export function makeKmsClient(): KMSClient {
  return new KMSClient({ endpoint: config.kmsEndpoint });
}
