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

const OneIdentityIdTokenClaims = z.object({
  aud: z.string(),
  dateOfBirth: z.string(),
  exp: z.number().int(),
  familyName: z.string(),
  fiscalNumber: z.string().optional(),
  iat: z.number().int(),
  iss: z.url(),
  name: z.string(),
  nonce: z.string(),
  personIdentifier: z.string().optional(),
  spidCode: z.string().optional(),
  sub: z.string(),
});

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

    async exchangeAuthorizationCode(code: string) {
      const response = await axios.post<OneIdentityTokenResponse>(
        `${config.oneIdentityDomain}/oidc/token`,
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
