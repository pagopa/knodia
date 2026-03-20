import type { RemoteResourceDbService } from "@knodia/db-remote-resource/services";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";

import type {
  API_CreatedPurposeResource,
  API_PurposeSeed,
} from "../models/purpose/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import { assertOrganizationExists } from "../utils/validators.ts";

export type PurposeService = ReturnType<typeof purposeServiceBuilder>;

export function purposeServiceBuilder(
  k2kGatewayClient: K2K2GatewayApiClient,
  remoteResourceDbService: RemoteResourceDbService,
  readmodelService: ReadmodelService,
) {
  return {
    async createPurpose(
      reqBody: API_PurposeSeed,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_CreatedPurposeResource> {
      const {
        dailyCalls,
        description,
        eserviceId,
        formAnswersJson,
        knodeId,
        name,
      } = reqBody;
      const { organizationId: consumerId } = authData;

      logger.info(
        { requestBody: reqBody },
        `Creating purpose for e-service owned by Knode ${knodeId} with body data`,
      );

      await assertOrganizationExists(consumerId, readmodelService);

      const { data } = await k2kGatewayApi.createPurpose({
        body: {
          consumerId,
          dailyCalls,
          description,
          eserviceId,
          formAnswersJson,
          name,
        },
        client: k2kGatewayClient,
      });

      await remoteResourceDbService.insertPurpose({
        consumerId,
        eserviceId,
        knodeId,
        purposeId: data.id,
      });

      return data;
    },
  };
}
