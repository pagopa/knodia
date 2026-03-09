import type { API_CreatedResource } from "@knodia/common-models/api";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import { CORRELATION_ID_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";

import type { API_AgreementSeed } from "../models/agreement/api.ts";

export type AgreementService = ReturnType<typeof agreementServiceBuilder>;

export function agreementServiceBuilder(
  k2kGatewayClient: K2K2GatewayApiClient,
) {
  return {
    async createAgreement(
      reqBody: API_AgreementSeed,
      { correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_CreatedResource> {
      const { knodeId, ...bodyWithoutKnodeId } = reqBody;

      logger.info(
        { requestBody: reqBody },
        `Creating agreement for e-service owned by Knode ${knodeId} with body data`,
      );

      const { data } = await k2kGatewayApi.createAgreement({
        body: bodyWithoutKnodeId,
        client: k2kGatewayClient,
        headers: {
          [CORRELATION_ID_HEADER]: correlationId,
        },
      });

      // TODO: save the remote agreement in the remote resources database

      return data;
    },
  };
}
