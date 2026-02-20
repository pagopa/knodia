import {
  GetPublicKeyCommand,
  KMSClient,
  SignCommand,
} from "@aws-sdk/client-kms";
import { UISessionTokenClaims, UserRole } from "@knodia/common-models/auth";
import { jwtVerify } from "jose";
import {
  createHash,
  createPublicKey,
  KeyObject,
  randomUUID,
} from "node:crypto";
import z from "zod";

import { config } from "../config/config.ts";

const CognitoPayload = z.object({
  aud: z.union([z.string(), z.array(z.string())]),
  "cognito:groups": z.array(z.string()),
  exp: z.number().int(),
  iat: z.number().int(),
  iss: z.string(),
  jti: z.string(),
  sub: z.string(),
});

const b64url = (data: string): string =>
  Buffer.from(data).toString("base64url");

export function authorizationServiceBuilder(kmsClient: KMSClient) {
  let cognitoPublicKey: KeyObject | undefined;

  async function getCognitoPublicKey(): Promise<KeyObject> {
    if (cognitoPublicKey) return cognitoPublicKey;

    const { PublicKey } = await kmsClient.send(
      new GetPublicKeyCommand({ KeyId: `alias/${config.cognitoKmsKeyId}` }),
    );

    if (!PublicKey) {
      throw new Error("KMS returned no public key");
    }

    const key = createPublicKey({
      format: "der",
      key: Buffer.from(PublicKey),
      type: "spki",
    });
    cognitoPublicKey = key;
    return key;
  }

  return {
    async generateUISessionToken(
      claims: UISessionTokenClaims,
    ): Promise<string> {
      const header = b64url(
        JSON.stringify({
          alg: "RS256",
          kid: config.knodiaKmsKeyId,
          typ: "JWT",
        }),
      );

      const now = Math.floor(Date.now() / 1000);
      const payload = b64url(
        JSON.stringify({
          aud: config.bffTokenAudience,
          exp: now + 3600,
          iat: now,
          iss: "local-knodia",
          jti: randomUUID(),
          organizationId: claims.organizationId,
          roles: claims.roles,
          sub: claims.sub,
          type: "ui-session",
        }),
      );

      const message = `${header}.${payload}`;
      const digest = createHash("sha256").update(message).digest();

      const { Signature } = await kmsClient.send(
        new SignCommand({
          KeyId: `alias/${config.knodiaKmsKeyId}`,
          Message: digest,
          MessageType: "DIGEST",
          SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256",
        }),
      );

      if (!Signature) {
        throw new Error("KMS sign returned no signature");
      }

      const signature = Buffer.from(Signature).toString("base64url");
      return `${message}.${signature}`;
    },

    async validateCognitoToken(token: string): Promise<UISessionTokenClaims> {
      const publicKey = await getCognitoPublicKey();

      const { payload: rawPayload } = await jwtVerify(token, publicKey, {
        algorithms: ["RS256"],
        audience: config.bffTokenAudience,
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

      return UISessionTokenClaims.parse({
        aud: cognitoPayload.aud,
        exp: cognitoPayload.exp,
        iat: cognitoPayload.iat,
        iss: cognitoPayload.iss,
        jti: cognitoPayload.jti,
        organizationId: orgGroup.slice("org:".length),
        roles,
        sub: cognitoPayload.sub,
        type: "ui-session",
      });
    },
  };
}

export function makeKmsClient(): KMSClient {
  return new KMSClient({ endpoint: config.kmsEndpoint });
}
