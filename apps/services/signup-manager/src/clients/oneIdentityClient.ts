import { forbiddenError } from "@knodia/fastify-zod-api-commons/models";
import axios from "axios";
import { createRemoteJWKSet, jwtVerify } from "jose";

import type { OneIdentityConfig } from "../config/config.ts";

export type OneIdentityClient = ReturnType<typeof oneIdentityClientBuilder>;

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
      const response = await axios.post<{
        access_token: string;
        expires_in: number;
        id_token: string;
        scope: string;
        token_type: string;
      }>(`${config.oneIdentityDomain}/oidc/token`, {
        body: new URLSearchParams({
          code,
          grant_type: "authorization_code",
          redirect_uri: config.oneIdentityRedirectUrl,
        }),
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config.oneIdentityClientId}:${config.oneIdentityClientSecret}`,
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return response.data;
    },

    async validateIdToken(idToken: string, nonce: string) {
      const jwks = createRemoteJWKSet(
        new URL(`${config.oneIdentityDomain}/oidc/keys`),
      );

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

      if (payload.nonce !== nonce) {
        throw forbiddenError("Invalid Token");
      }

      return {
        claims: payload,
        header: protectedHeader,
      };
    },
  };
}
