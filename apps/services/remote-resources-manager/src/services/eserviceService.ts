/* eslint-disable max-lines-per-function */
import type { RemoteResourceDbService } from "@knodia/db-remote-resource/services";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import {
  type ExternalResource,
  unsafeBrandExternalId,
} from "@knodia/common-models/externalResource";
import { EserviceId } from "@knodia/common-models/ids";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import { remoteResourceAgreement } from "@knodia/db-remote-resource";
import { getExternalEntitiesMap } from "@knodia/fastify-zod-api-commons";
import { parseContentDispositionFileName } from "@knodia/fastify-zod-api-commons/http";
import { genericError } from "@knodia/fastify-zod-api-commons/models";
import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";
import { eq } from "drizzle-orm";

import type {
  API_CatalogEserviceSearchResults,
  API_Eservice,
  API_EserviceDetails,
  API_Eservices,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
  API_GetEservicesQueryParams,
} from "../models/eservice/api.ts";

import { toK2KAPI_AgreementState } from "../models/agreement/apiConverter.ts";
import {
  toAPI_CatalogEserviceSearchResult,
  toAPI_Eservice,
  toAPI_EserviceDetails,
} from "../models/eservice/apiConverter.ts";
import { assertEntityExists } from "../utils/validators.ts";

export type EserviceService = ReturnType<typeof eserviceServiceBuilder>;

export function eserviceServiceBuilder(
  k2kGatewayClient: K2K2GatewayApiClient,
  remoteResourceDbService: RemoteResourceDbService,
) {
  return {
    async downloadEserviceLatestVersionInterface(
      eserviceId: ExternalResource<EserviceId>,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<{ buffer: Buffer; contentType: string; fileName: string }> {
      logger.info(
        { eserviceId: eserviceId.id, knodeId: eserviceId.knodeId },
        `Downloading interface of E-service ${eserviceId.id} from Knode ${eserviceId.knodeId}`,
      );

      const { data: blob, headers } =
        await k2kGatewayApi.downloadEserviceLatestVersionInterface({
          client: k2kGatewayClient,
          path: { eserviceId: eserviceId.id },
          responseType: "arraybuffer",
        });

      return {
        buffer: Buffer.from(blob as unknown as ArrayBuffer),
        contentType: headers["content-type"] ?? "application/octet-stream",
        fileName: parseContentDispositionFileName(
          headers["content-disposition"],
        ),
      };
    },

    async getCatalogEservices(
      reqBody: API_GetCatalogEserviceSearchParams,
      reqQuery: API_GetCatalogEservicesQueryParams,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_CatalogEserviceSearchResults> {
      const { knodeId, ...bodyWithoutKnodeId } = reqBody;

      logger.info(
        { requestBody: reqBody, requestQuery: reqQuery },
        `Getting E-services owned by Knode ${knodeId} with query parameters and body data`,
      );

      const { data } = await k2kGatewayApi.getCatalogEservices({
        body: bodyWithoutKnodeId,
        client: k2kGatewayClient,
        query: reqQuery,
      });

      const producersMap = await getExternalEntitiesMap({
        fetchFn: async ({ entityIds }) =>
          await k2kGatewayApi
            .getOrganizations({
              client: k2kGatewayClient,
              query: {
                limit: entityIds.length,
                offset: 0,
                organizationId: entityIds,
              },
            })
            .then((res) => res.data.results),
        getEntityId: (agreement) => agreement.producerId,
        getKnodeId: knodeId,
        items: data.results,
      });

      return {
        pagination: data.pagination,
        results: data.results.map((r) => {
          const producer = producersMap
            .get(knodeId)
            ?.get(unsafeBrandExternalId(r.producerId));
          if (!producer) {
            throw genericError(
              `Producer Organization ${r.producerId} not found for E-service ${r.id}`,
            );
          }
          return toAPI_CatalogEserviceSearchResult(r, producer.name);
        }),
      };
    },

    async getEserviceDetails(
      eserviceId: ExternalResource<EserviceId>,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_EserviceDetails> {
      logger.info(
        { eserviceId: eserviceId.id, knodeId: eserviceId.knodeId },
        `Getting E-service detail ${eserviceId.id} from Knode ${eserviceId.knodeId}`,
      );

      const path = { eserviceId: eserviceId.id };

      const [{ data: eservice }, { data: version }] = await Promise.all([
        k2kGatewayApi.getEservice({
          client: k2kGatewayClient,
          path,
        }),
        k2kGatewayApi.getEserviceLatestVersion({
          client: k2kGatewayClient,
          path,
        }),
      ]);

      const { data: producer } = await k2kGatewayApi.getOrganization({
        client: k2kGatewayClient,
        path: { organizationId: eservice.producerId },
      });

      return toAPI_EserviceDetails(eservice, version, producer);
    },

    async getEservices(
      reqQuery: API_GetEservicesQueryParams,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Eservices> {
      logger.info(
        { requestQuery: reqQuery },
        `Getting Consumer E-services with query parameters`,
      );

      const { agreementState, limit, offset } = reqQuery;

      let totalCount = 0;
      let dynamicLimit = limit;
      let dynamicOffset = offset;
      let results: API_Eservice[] = [];
      const knodesWithAgreements =
        await remoteResourceDbService.getDistinctKnodes(
          authData.organizationId,
        );
      for (const knodeId of knodesWithAgreements) {
        logger.info(
          `Getting E-services from Knode ${knodeId} for Consumer Organization ${authData.organizationId}`,
        );

        const { data: consumerAgreements } = await k2kGatewayApi.getAgreements({
          client: k2kGatewayClient,
          query: {
            consumerId: authData.organizationId,
            limit: dynamicLimit,
            offset: dynamicOffset,
            state: agreementState
              ? toK2KAPI_AgreementState(agreementState)
              : undefined,
          },
        });

        if (results.length < limit) {
          const [producersMap, eservicesMap, eserviceVersionsMap] =
            await Promise.all([
              getExternalEntitiesMap({
                fetchFn: async ({ entityIds }) =>
                  await k2kGatewayApi
                    .getOrganizations({
                      client: k2kGatewayClient,
                      query: {
                        limit: entityIds.length,
                        offset: 0,
                        organizationId: entityIds,
                      },
                    })
                    .then((res) => res.data.results),
                getEntityId: (agreement) => agreement.producerId,
                getKnodeId: knodeId,
                items: consumerAgreements.results,
              }),
              getExternalEntitiesMap({
                fetchFn: ({ entityIds }) =>
                  Promise.all(
                    entityIds.map((eserviceId) =>
                      k2kGatewayApi.getEservice({
                        client: k2kGatewayClient,
                        path: { eserviceId },
                      }),
                    ),
                  ).then((responses) => responses.map((res) => res.data)),
                getEntityId: (agreement) => agreement.eserviceId,
                getKnodeId: knodeId,
                items: consumerAgreements.results,
              }),
              getExternalEntitiesMap({
                fetchFn: ({ entityIds }) =>
                  Promise.all(
                    entityIds.map((eserviceId) =>
                      k2kGatewayApi.getEserviceLatestVersion({
                        client: k2kGatewayClient,
                        path: { eserviceId },
                      }),
                    ),
                  ).then((responses) => responses.map((res) => res.data)),
                getEntityId: (agreement) => agreement.eserviceId,
                getKnodeId: knodeId,
                items: consumerAgreements.results,
              }),
            ]);

          results = results.concat(
            await Promise.all(
              consumerAgreements.results.map(async (agreement) => {
                const remoteAgreement =
                  await remoteResourceDbService.getAgreementByFilters(
                    eq(remoteResourceAgreement.agreementId, agreement.id),
                  );

                const knodeId = API_KnodeId.parse(remoteAgreement.knodeId);

                return toAPI_Eservice({
                  agreement,
                  eservice: assertEntityExists(
                    eservicesMap
                      .get(knodeId)
                      ?.get(unsafeBrandExternalId(agreement.eserviceId)),
                    `E-service ${agreement.eserviceId} not found for Agreement ${agreement.id}`,
                  ),
                  eserviceVersion: assertEntityExists(
                    eserviceVersionsMap
                      .get(knodeId)
                      ?.get(unsafeBrandExternalId(agreement.eserviceVersionId)),
                    `E-service version for E-service ${agreement.eserviceId} not found for Agreement ${agreement.id}`,
                  ),
                  producer: {
                    ...assertEntityExists(
                      producersMap
                        .get(knodeId)
                        ?.get(unsafeBrandExternalId(agreement.producerId)),
                      `Producer Organization ${agreement.producerId} not found for Agreement ${agreement.id}`,
                    ),
                    knodeId,
                  },
                });
              }),
            ),
          );

          dynamicLimit = limit - results.length;
          dynamicOffset = 0;
        }

        totalCount += consumerAgreements.pagination.total;
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
  };
}
