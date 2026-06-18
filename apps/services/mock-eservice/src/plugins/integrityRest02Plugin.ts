import type { EserviceAccessTokenClaims } from "@knodia/common-models/auth";
import type { IntegrityRest02Config } from "@knodia/integrity-rest-02/config";
import type { IntegrityRest02Generator } from "@knodia/integrity-rest-02/generator";

import { requestContext } from "@fastify/request-context";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  CONTENT_ENCODING_HEADER,
  CONTENT_TYPE_HEADER,
  DIGEST_HEADER,
  KNODIA_JWT_SIGNATURE_HEADER,
} from "@knodia/integrity-rest-02/models";
import { calculateIntegrityRest02Digest } from "@knodia/integrity-rest-02/utils";
import fastifyPlugin from "fastify-plugin";

import { retrieveAccessTokenClaims } from "../utils/retrievalUtils.ts";

// Augment @fastify/request-context so routers in this service can read the
// verified access-token claims stashed by the auth plugins.
declare module "@fastify/request-context" {
  interface RequestContextData {
    accessTokenClaims?: EserviceAccessTokenClaims;
  }
}

interface IntegrityRest02PluginOptions {
  integrityRest02Config: IntegrityRest02Config;
  integrityRest02Generator: IntegrityRest02Generator;
}

export const integrityRest02Plugin =
  fastifyPlugin<IntegrityRest02PluginOptions>(
    async (fastify, { integrityRest02Config, integrityRest02Generator }) => {
      fastify.addHook("onSend", async (_request, response, payload) => {
        const { correlationId } = getContextValues(requestContext);

        const claims = retrieveAccessTokenClaims();

        const digest = calculateIntegrityRest02Digest(payload);
        const { serialized } =
          await integrityRest02Generator.generateKnodiaJwtSignature({
            clientId: claims.client_id,
            contentEncoding: response.getHeader(CONTENT_ENCODING_HEADER),
            contentType: response.getHeader(CONTENT_TYPE_HEADER),
            correlationId,
            digest,
            issuer: integrityRest02Config.integrityRest02SignatureIssuer,
            kid: integrityRest02Config.integrityRest02SignatureKid,
            secondsDuration:
              integrityRest02Config.integrityRest02SignatureSecondsDuration,
          });

        response.header(KNODIA_JWT_SIGNATURE_HEADER, serialized);
        response.header(DIGEST_HEADER, digest);

        return payload;
      });
    },
  );
