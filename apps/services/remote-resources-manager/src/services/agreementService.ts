import type { RemoteResourceDbService } from "@knodia/db-remote-resource/services";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";

import type {
  API_AgreementSeed,
  API_CreatedAgreementResource,
} from "../models/agreement/api.ts";

export type AgreementService = ReturnType<typeof agreementServiceBuilder>;

export function agreementServiceBuilder(
  k2kGatewayClient: K2K2GatewayApiClient,

  remoteResourceDbService: RemoteResourceDbService,
) {
  return {
    async createAgreement(
      reqBody: API_AgreementSeed,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_CreatedAgreementResource> {
      const { consumerId, eserviceId, eserviceVersionId, knodeId } = reqBody;

      logger.info(
        { requestBody: reqBody },
        `Creating agreement for e-service owned by Knode ${knodeId} with body data`,
      );

      // TODO: add assertOrganizationExists(consumerId) to check if the seed consumerId exists before calling the K2K Gateway API

      const { data: createdAgreement } = await k2kGatewayApi.createAgreement({
        body: {
          consumerId,
          eserviceId,
          eserviceVersionId,
        },
        client: k2kGatewayClient,
      });

      await remoteResourceDbService.insertAgreement({
        agreementId: createdAgreement.id,
        consumerId,
        eserviceId,
        eserviceVersionId,
        knodeId,
        producerId: createdAgreement.producerId,
      });

      return createdAgreement;
    },
  };
}
