import type { RequestContextData } from "@fastify/request-context";
import type { API_Agreement } from "@knodia/agreement-models/api";

import { CORRELATION_ID_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";

import type { API_AgreementSeed } from "../models/agreement/api.ts";

import {
  toAPI_Agreement,
  toK2KAPI_AgreementSeed,
} from "../models/agreement/apiConverter.ts";

export type AgreementService = ReturnType<typeof agreementServiceBuilder>;

export function agreementServiceBuilder(
  k2kGatewayClient: K2K2GatewayApiClient,
) {
  return {
    async createAgreement(
      reqBody: API_AgreementSeed,
      { correlationId, logger }: RequestContextData,
    ): Promise<API_Agreement> {
      logger.info(
        { requestBody: reqBody },
        `Creating agreement for e-service owned by Knode ${reqBody.knodeId} with body data`,
      );

      const { data } = await k2kGatewayApi.createAgreement({
        body: toK2KAPI_AgreementSeed(reqBody),
        client: k2kGatewayClient,
        headers: {
          [CORRELATION_ID_HEADER]: correlationId,
        },
      });

      // TODO: save the remote agreement in the remote resources database

      return toAPI_Agreement(data);
    },
  };
}
