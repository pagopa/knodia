import type { FastifyBaseLogger } from "fastify";

import { forbiddenError } from "@knodia/fastify-zod-api-commons/models";
import axios from "axios";
import { createRemoteJWKSet, jwtVerify } from "jose";
import z from "zod";

import type { OneIdentityConfig } from "../config/config.ts";

export type OneIdentityClient = ReturnType<typeof oneIdentityClientBuilder>;

const OneIdentityTokenResponse = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  id_token: z.string(),
  scope: z.string(),
  token_type: z.string(),
});

type OneIdentityTokenResponse = z.infer<typeof OneIdentityTokenResponse>;

const OneIdentityCommonIdTokenClaims = z.object({
  aud: z.string(),
  exp: z.number().int(),
  // Reject empty strings: present here, but absent to the truthiness-based DB
  // lookup, so they persist a value that never matches on a later login.
  fiscalNumber: z.string().min(1).optional(),
  iat: z.number().int(),
  iss: z.url(),
  nonce: z.string(),
  PersonIdentifier: z.string().min(1).optional(),
  spidCode: z.string().min(1).optional(),
  sub: z.string(),
});

const OneIdentitySpidOrCieProfileClaims = z.object({
  dateOfBirth: z.string(),
  familyName: z.string(),
  name: z.string(),
});

const OneIdentityEidasProfileClaims = z
  .object({
    DateOfBirth: z.string(),
    FamilyName: z.string(),
    FirstName: z.string(),
  })
  .transform(({ DateOfBirth, FamilyName, FirstName }) => ({
    dateOfBirth: DateOfBirth,
    familyName: FamilyName,
    name: FirstName,
  }));

const OneIdentityIdTokenClaims = z.intersection(
  OneIdentityCommonIdTokenClaims,
  z.union([OneIdentitySpidOrCieProfileClaims, OneIdentityEidasProfileClaims]),
);

type OneIdentityIdTokenClaims = z.infer<typeof OneIdentityIdTokenClaims>;

export function oneIdentityClientBuilder(config: OneIdentityConfig) {
  return {
    buildOneIdentityLoginUrl({
      nonce,
      state,
    }: {
      nonce: string;
      state: string;
    }): string {
      const parameters = new URLSearchParams({
        client_id: config.oneIdentityClientId,
        nonce,
        redirect_uri: config.oneIdentityRedirectUrl,
        response_type: "code",
        scope: "openid",
        state,
      });

      return `${config.oneIdentityDomain}/login?${parameters.toString()}`;
    },

    async exchangeAuthorizationCode(code: string, logger: FastifyBaseLogger) {
      // Server-to-server call: in containers the token endpoint isn't reachable
      // at the browser-facing oneIdentityDomain. Keep its path, swap the host
      // for the JWKS URI's (already the server-reachable base).
      const tokenUrl = new URL(`${config.oneIdentityDomain}/oidc/token`);
      const serverBase = new URL(config.oneIdentityJWKSUri);
      tokenUrl.protocol = serverBase.protocol;
      tokenUrl.host = serverBase.host;

      try {
        const response = await axios.post<OneIdentityTokenResponse>(
          tokenUrl.toString(),
          new URLSearchParams({
            code,
            grant_type: "authorization_code",
            redirect_uri: config.oneIdentityRedirectUrl,
          }).toString(),
          {
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${config.oneIdentityClientId}:${config.oneIdentityClientSecret}`,
              ).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
          },
        );

        return OneIdentityTokenResponse.parse(response.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          logger.error(
            {
              data: error.response?.data,
              oneIdentityClientId: config.oneIdentityClientId,
              status: error.response?.status,
              url: error.config
                ? axios.getUri(error.config)
                : tokenUrl.toString(),
            },
            "Error exchanging authorization code with OneIdentity",
          );
        }
        throw error;
      }
    },

    async validateIdToken(idToken: string, nonce: string) {
      const jwks = createRemoteJWKSet(new URL(config.oneIdentityJWKSUri));

      const { payload, protectedHeader } = await jwtVerify<{ nonce: string }>(
        idToken,
        jwks,
        {
          audience: config.oneIdentityClientId,
          issuer: config.oneIdentityDomain,
        },
      ).catch(() => {
        throw forbiddenError("Invalid Token");
      });

      const parsedClaimsResult = OneIdentityIdTokenClaims.safeParse(payload);

      if (
        !parsedClaimsResult.success ||
        parsedClaimsResult.data.nonce !== nonce
      ) {
        throw forbiddenError("Invalid Token");
      }

      return {
        claims: parsedClaimsResult.data,
        header: protectedHeader,
      };
    },
  };
}
