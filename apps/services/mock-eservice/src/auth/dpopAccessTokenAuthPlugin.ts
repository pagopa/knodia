import type { JtiReplayStore } from "@knodia/db-jti-replay-store";

import { requestContext } from "@fastify/request-context";
import {
  assertDpopProofNotReplayed,
  verifyDpopProofSignature,
} from "@knodia/dpop-validator";
import { parseAuthHeaderToken } from "@knodia/fastify-zod-api-commons/auth";
import { createHash } from "crypto";
import fastifyPlugin from "fastify-plugin";
import { calculateJwkThumbprint, type JWTVerifyGetKey } from "jose";

import {
  dpopProofNotFound,
  invalidDpopProofAth,
  invalidDpopProofJwsFormat,
  invalidDpopThumbprint,
} from "../models/errors.ts";
import { verifyEserviceAccessToken } from "../utils/validators.ts";

const DPOP_PREFIX = "dpop ";

interface DpopAccessTokenAuthPluginOptions {
  acceptedAudiences: string[];
  dpopProofHtuBaseUrl: string;
  dpopProofMaxTokenAgeSeconds: number;
  dpopProofStore: JtiReplayStore;
  expectedIssuer: string;
  jwksResolvers: JWTVerifyGetKey[];
  jwtClockToleranceSeconds: number;
}

export const dpopAccessTokenAuthPlugin =
  fastifyPlugin<DpopAccessTokenAuthPluginOptions>(async (fastify, opts) => {
    fastify.addHook("onRequest", async (request) => {
      const token = parseAuthHeaderToken(
        request.headers.authorization,
        DPOP_PREFIX,
      );
      const claims = await verifyEserviceAccessToken(token, opts, true);

      const accessTokenJkt = claims.cnf.jkt;

      const dpopProofJWS = request.headers["dpop"];
      if (!dpopProofJWS) {
        throw dpopProofNotFound();
      }
      if (typeof dpopProofJWS !== "string") {
        throw invalidDpopProofJwsFormat(dpopProofJWS);
      }

      const expectedHtu = `${opts.dpopProofHtuBaseUrl}${request.url.split("?")[0]}`;
      const dpopProofJWT = await verifyDpopProofSignature(
        dpopProofJWS,
        {
          expectedHtm: request.method,
          expectedHtu,
          jwtClockToleranceSeconds: opts.jwtClockToleranceSeconds,
          maxTokenAgeSeconds: opts.dpopProofMaxTokenAgeSeconds,
        },
        request.log,
      );

      const expectedAth = createHash("sha256")
        .update(token)
        .digest("base64url");
      if (dpopProofJWT.payload.ath !== expectedAth) {
        throw invalidDpopProofAth(dpopProofJWT.payload.ath, expectedAth);
      }

      const jktFromDpopProof = await calculateJwkThumbprint(
        dpopProofJWT.headers.jwk,
      );
      if (jktFromDpopProof !== accessTokenJkt) {
        throw invalidDpopThumbprint(jktFromDpopProof, accessTokenJkt);
      }

      await assertDpopProofNotReplayed(
        dpopProofJWT,
        opts.dpopProofMaxTokenAgeSeconds,
        opts.dpopProofStore,
        opts.jwtClockToleranceSeconds,
      );

      requestContext.set("accessTokenClaims", claims);
    });
  });
