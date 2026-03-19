import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  AgreementId,
  EserviceId,
  KnodeId,
} from "@knodia/common-models/ids";
import type { RemoteResourceDbService } from "@knodia/db-remote-resource/services";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";

import type {
  API_Agreement,
  API_Agreements,
  API_AgreementSeed,
  API_CreatedAgreementResource,
  API_GetAgreementsQueryParams,
} from "../models/agreement/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  toAPI_Agreement,
  toK2KAPI_AgreementState,
} from "../models/agreement/apiConverter.ts";
import { agreementNotFound } from "../models/errors.ts";
import {
  assertConsumerHasRequiredAttributes,
  assertOrganizationExists,
} from "../utils/validators.ts";

export type AgreementService = ReturnType<typeof agreementServiceBuilder>;

export function agreementServiceBuilder(
  k2kGatewayClient: K2K2GatewayApiClient,
  remoteResourceDbService: RemoteResourceDbService,
  readmodelService: ReadmodelService,
) {
  return {
    async createAgreement(
      reqBody: API_AgreementSeed,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_CreatedAgreementResource> {
      const { eserviceId, eserviceVersionId, knodeId } = reqBody;
      const { organizationId: consumerId } = authData;

      logger.info(
        { requestBody: reqBody },
        `Creating agreement for e-service owned by Knode ${knodeId} with body data`,
      );

      const [organization, { data: eserviceVersion }] = await Promise.all([
        assertOrganizationExists(consumerId, readmodelService),
        k2kGatewayApi.getEserviceLatestVersion({
          client: k2kGatewayClient,
          path: { eserviceId },
        }),
      ]);

      assertConsumerHasRequiredAttributes(
        organization.attributes,
        eserviceVersion.requiredAttributes,
        consumerId,
        unsafeBrandExternalId<EserviceId>(eserviceId),
      );

      const { data } = await k2kGatewayApi.createAgreement({
        body: {
          consumerId,
          eserviceId,
          eserviceVersionId,
        },
        client: k2kGatewayClient,
      });

      await remoteResourceDbService.insertAgreement({
        agreementId: data.id,
        consumerId,
        eserviceId,
        eserviceVersionId,
        knodeId,
        producerId: data.producerId,
      });

      return data;
    },

    async getAgreement(
      agreementId: ExternalId<AgreementId>,
      knodeId: KnodeId,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Agreement> {
      logger.info(`Getting Agreement ${agreementId} from Knode ${knodeId}`);

      const remoteAgreement = await remoteResourceDbService.getAgreementById(
        agreementId,
        knodeId,
      );

      if (!remoteAgreement) {
        throw agreementNotFound(agreementId);
      }

      const { data } = await k2kGatewayApi.getAgreement({
        client: k2kGatewayClient,
        path: { agreementId },
      });

      return toAPI_Agreement(data);
    },

    async getAgreements(
      requestQuery: API_GetAgreementsQueryParams,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Agreements> {
      logger.info({ requestQuery }, "Getting Agreements with query params");

      const { data } = await k2kGatewayApi.getAgreements({
        client: k2kGatewayClient,
        query: {
          consumerId: requestQuery.consumerId,
          limit: requestQuery.limit,
          offset: requestQuery.offset,
          state: requestQuery.state
            ? toK2KAPI_AgreementState(requestQuery.state)
            : undefined,
        },
      });

      return {
        pagination: data.pagination,
        results: data.results.map(toAPI_Agreement),
      };
    },
  };
}
