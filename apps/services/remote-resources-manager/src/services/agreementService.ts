/* eslint-disable max-lines-per-function */
import type { API_MagicLink } from "@knodia/agreement-models/api";
import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  AgreementId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";
import type { RemoteResourceDbService } from "@knodia/db-remote-resource/services";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import type { K2K2GatewayApiClientFactory } from "../clients/clientsProvider.ts";
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
import { retrieveOrganization } from "../utils/readmodelUtils.ts";
import {
  assertAgreementExists,
  assertOrganizationIsAgreementConsumer,
} from "../utils/validators.ts";

export type AgreementService = ReturnType<typeof agreementServiceBuilder>;

export function agreementServiceBuilder(
  getK2K2GatewayApiClient: K2K2GatewayApiClientFactory,
  remoteResourceDbService: RemoteResourceDbService,
  readmodelService: ReadmodelService,
) {
  return {
    async archiveAgreement(
      agreementId: ExternalId<AgreementId>,
      targetKnodeId: KnodeId,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Agreement> {
      logger.info(
        `Archiving Agreement ${agreementId} on Knode ${targetKnodeId}`,
      );

      await verifyConsumerCanActOnAgreement(
        agreementId,
        targetKnodeId,
        authData.organizationId,
        remoteResourceDbService,
        readmodelService,
      );

      const { data } = await k2kGatewayApi.archiveAgreement({
        client: getK2K2GatewayApiClient(targetKnodeId),
        path: { agreementId },
      });

      return toAPI_Agreement(data, targetKnodeId);
    },

    async createActivationMagicLink(
      agreementId: ExternalId<AgreementId>,
      targetKnodeId: KnodeId,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_MagicLink> {
      logger.info(
        `Creating activation magic link for Agreement ${agreementId} on Knode ${targetKnodeId}`,
      );

      await verifyConsumerCanActOnAgreement(
        agreementId,
        targetKnodeId,
        authData.organizationId,
        remoteResourceDbService,
        readmodelService,
      );

      const { data } = await k2kGatewayApi.createAgreementActivationMagicLink({
        client: getK2K2GatewayApiClient(targetKnodeId),
        path: { agreementId },
      });

      return data;
    },

    async createAgreement(
      reqBody: API_AgreementSeed,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_CreatedAgreementResource> {
      const { eserviceId, eserviceVersionId, knodeId: targetKnodeId } = reqBody;
      const { organizationId: consumerId } = authData;

      logger.info(
        { requestBody: reqBody },
        `Creating agreement for e-service owned by Knode ${targetKnodeId} with body data`,
      );

      const organization = await retrieveOrganization(
        consumerId,
        readmodelService,
      );

      const { data } = await k2kGatewayApi.createAgreement({
        body: {
          consumerAttributes: organization.attributes,
          consumerId,
          eserviceId,
          eserviceVersionId,
        },
        client: getK2K2GatewayApiClient(targetKnodeId),
      });

      await remoteResourceDbService.insertAgreement({
        agreementId: data.id,
        consumerId,
        eserviceId,
        eserviceVersionId,
        knodeId: targetKnodeId,
        producerId: data.producerId,
      });

      return data;
    },

    async getAgreement(
      agreementId: ExternalId<AgreementId>,
      targetKnodeId: KnodeId,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Agreement> {
      logger.info(
        `Getting Agreement ${agreementId} from Knode ${targetKnodeId}`,
      );

      const remoteAgreement = await remoteResourceDbService.getAgreementById(
        agreementId,
        targetKnodeId,
      );

      assertAgreementExists(remoteAgreement, agreementId);

      const { data } = await k2kGatewayApi.getAgreement({
        client: getK2K2GatewayApiClient(targetKnodeId),
        path: { agreementId },
      });

      return toAPI_Agreement(data, targetKnodeId);
    },

    async getAgreements(
      requestQuery: API_GetAgreementsQueryParams,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Agreements> {
      const { limit, offset, state } = requestQuery;

      let totalCount = 0;
      let dynamicLimit = limit;
      let dynamicOffset = offset;
      let results: API_Agreement[] = [];
      const knodesWithAgreements =
        await remoteResourceDbService.getAgreementsDistinctKnodes(
          authData.organizationId,
        );
      for (const targetKnodeId of knodesWithAgreements) {
        logger.info(
          { requestQuery },
          `Getting Agreements from Knode ${targetKnodeId} with query params`,
        );

        const { data } = await k2kGatewayApi.getAgreements({
          client: getK2K2GatewayApiClient(targetKnodeId),
          query: {
            consumerId: authData.organizationId,
            limit: dynamicLimit,
            offset: dynamicOffset,
            state: state?.map(toK2KAPI_AgreementState),
          },
        });

        if (results.length < limit) {
          results = results.concat(
            data.results.map((agreement) =>
              toAPI_Agreement(agreement, targetKnodeId),
            ),
          );

          dynamicLimit = limit - results.length;
          dynamicOffset = 0;
        }

        totalCount += data.pagination.total;
      }

      return {
        pagination: {
          limit,
          offset,
          total: totalCount,
        },
        results,
      };
    },

    async reactivateAgreement(
      agreementId: ExternalId<AgreementId>,
      targetKnodeId: KnodeId,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Agreement> {
      logger.info(
        `Reactivating Agreement ${agreementId} on Knode ${targetKnodeId}`,
      );

      await verifyConsumerCanActOnAgreement(
        agreementId,
        targetKnodeId,
        authData.organizationId,
        remoteResourceDbService,
        readmodelService,
      );

      const { data } = await k2kGatewayApi.reactivateAgreement({
        client: getK2K2GatewayApiClient(targetKnodeId),
        path: { agreementId },
      });

      return toAPI_Agreement(data, targetKnodeId);
    },

    async suspendAgreement(
      agreementId: ExternalId<AgreementId>,
      targetKnodeId: KnodeId,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Agreement> {
      logger.info(
        `Suspending Agreement ${agreementId} on Knode ${targetKnodeId}`,
      );

      await verifyConsumerCanActOnAgreement(
        agreementId,
        targetKnodeId,
        authData.organizationId,
        remoteResourceDbService,
        readmodelService,
      );

      const { data } = await k2kGatewayApi.suspendAgreement({
        client: getK2K2GatewayApiClient(targetKnodeId),
        path: { agreementId },
      });

      return toAPI_Agreement(data, targetKnodeId);
    },
  };
}

async function verifyConsumerCanActOnAgreement(
  agreementId: ExternalId<AgreementId>,
  targetKnodeId: KnodeId,
  organizationId: OrganizationId,
  remoteResourceDbService: RemoteResourceDbService,
  readmodelService: ReadmodelService,
): Promise<void> {
  await retrieveOrganization(organizationId, readmodelService);

  const remoteAgreement = await remoteResourceDbService.getAgreementById(
    agreementId,
    targetKnodeId,
  );

  assertAgreementExists(remoteAgreement, agreementId);
  assertOrganizationIsAgreementConsumer(
    remoteAgreement,
    agreementId,
    organizationId,
  );
}
