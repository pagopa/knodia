/* eslint-disable max-lines-per-function */
import type { RemoteResourceDbService } from "@knodia/db-remote-resource/services";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { K2K2GatewayApiClientFactory } from "@knodia/k2k-gateway-client/factory";

import {
  type ExternalResource,
  unsafeBrandExternalId,
} from "@knodia/common-models/externalResource";
import { type EserviceId } from "@knodia/common-models/ids";
import { parseContentDispositionFileName } from "@knodia/common-models/utils";
import {
  assertEntityExists,
  getExternalEntitiesMap,
} from "@knodia/fastify-zod-api-commons/utils";
import { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import type {
  API_CatalogEserviceSearchResults,
  API_EserviceDetails,
  API_Eservices,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
  API_GetEservicesQueryParams,
  API_PurposeFormOptions,
} from "../models/eservice/api.ts";

import { toK2KAPI_AgreementState } from "../models/agreement/apiConverter.ts";
import {
  toAPI_CatalogEserviceSearchResult,
  toAPI_Eservice,
  toAPI_EserviceDetails,
} from "../models/eservice/apiConverter.ts";
import {
  emptyListingPage,
  resolveSingleListingKnode,
} from "../utils/singleKnodeListing.ts";

export type EserviceService = ReturnType<typeof eserviceServiceBuilder>;

export function eserviceServiceBuilder(
  getK2K2GatewayApiClient: K2K2GatewayApiClientFactory,
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
          client: getK2K2GatewayApiClient(eserviceId.knodeId),
          path: { eserviceId: eserviceId.id },
          responseType: "arraybuffer",
        });

      const contentType = headers["content-type"];
      const contentDisposition = headers["content-disposition"];
      return {
        buffer: Buffer.from(blob as unknown as ArrayBuffer),
        contentType:
          typeof contentType === "string"
            ? contentType
            : "application/octet-stream",
        fileName: parseContentDispositionFileName(
          typeof contentDisposition === "string"
            ? contentDisposition
            : undefined,
        ),
      };
    },

    async getCatalogEservices(
      reqBody: API_GetCatalogEserviceSearchParams,
      reqQuery: API_GetCatalogEservicesQueryParams,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_CatalogEserviceSearchResults> {
      const { knodeId: targetKnodeId, ...bodyWithoutKnodeId } = reqBody;

      logger.info(
        { requestBody: reqBody, requestQuery: reqQuery },
        `Getting E-services owned by Knode ${targetKnodeId} with query parameters and body data`,
      );

      const k2kGatewayClient = getK2K2GatewayApiClient(targetKnodeId);

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
        items: data.results,
        knodeId: targetKnodeId,
      });

      return {
        pagination: data.pagination,
        results: data.results.map((r) => {
          const producer = assertEntityExists(
            producersMap.get(unsafeBrandExternalId(r.producerId)),
            `Producer Organization ${r.producerId} owned by Knode ${targetKnodeId} not found for E-service ${r.id}`,
          );
          return toAPI_CatalogEserviceSearchResult(
            r,
            producer.name,
            targetKnodeId,
          );
        }),
      };
    },

    async getEserviceDetails(
      eserviceId: ExternalResource<EserviceId>,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_EserviceDetails> {
      logger.info(
        { eserviceId: eserviceId.id, knodeId: eserviceId.knodeId },
        `Getting E-service detail ${eserviceId.id} from Knode ${eserviceId.knodeId}`,
      );

      const k2kGatewayClient = getK2K2GatewayApiClient(eserviceId.knodeId);

      const eserviceIdPath = { eserviceId: eserviceId.id };

      const [{ data: eservice }, { data: version }, { data: agreements }] =
        await Promise.all([
          k2kGatewayApi.getEservice({
            client: k2kGatewayClient,
            path: eserviceIdPath,
          }),
          k2kGatewayApi.getEserviceLatestVersion({
            client: k2kGatewayClient,
            path: eserviceIdPath,
          }),
          k2kGatewayApi.getAgreements({
            client: k2kGatewayClient,
            query: {
              consumerId: authData.organizationId,
              eserviceId: eserviceId.id,
              // Returns the "current" agreement for this (consumer, e-service). When
              // older Archived agreements coexist with a non-archived one, the default
              // `updatedAt DESC` sort puts the non-archived one first (archived
              // agreements aren't updated after archival), so `limit: 1` is enough, no state filter required.
              // TODO: revisit if the default sort order changes.
              limit: 1,
              offset: 0,
            },
          }),
        ]);

      const agreement = agreements.results.at(0);

      const { data: producer } = await k2kGatewayApi.getOrganization({
        client: k2kGatewayClient,
        path: { organizationId: eservice.producerId },
      });

      return toAPI_EserviceDetails(
        eservice,
        version,
        { ...producer, knodeId: eserviceId.knodeId },
        agreement,
      );
    },

    async getEservicePurposeFormOptions(
      eserviceId: ExternalResource<EserviceId>,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_PurposeFormOptions> {
      logger.info(
        { eserviceId: eserviceId.id, knodeId: eserviceId.knodeId },
        `Getting PurposeFormOptions for E-service ${eserviceId.id} on Knode ${eserviceId.knodeId}`,
      );

      const { data } = await k2kGatewayApi.getEservicePurposeFormOptions({
        client: getK2K2GatewayApiClient(eserviceId.knodeId),
        path: { eserviceId: eserviceId.id },
      });

      return data;
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
      const k2kAgreementStates = agreementState?.map(toK2KAPI_AgreementState);

      const targetKnodeId = resolveSingleListingKnode(
        await remoteResourceDbService.getAgreementsDistinctKnodes(
          authData.organizationId,
        ),
      );
      if (targetKnodeId === undefined) {
        return emptyListingPage(limit, offset);
      }

      logger.info(
        `Getting E-services from Knode ${targetKnodeId} for Consumer Organization ${authData.organizationId}`,
      );

      const k2kGatewayClient = getK2K2GatewayApiClient(targetKnodeId);

      const { data: consumerAgreements } = await k2kGatewayApi.getAgreements({
        client: k2kGatewayClient,
        query: {
          consumerId: authData.organizationId,
          limit,
          offset,
          state: k2kAgreementStates,
        },
      });

      const [producersMap, eservicesMap, eserviceVersionsMap] =
        await Promise.all([
          getExternalEntitiesMap({
            fetchFn: ({ entityIds }) =>
              k2kGatewayApi
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
            items: consumerAgreements.results,
            knodeId: targetKnodeId,
          }),
          getExternalEntitiesMap({
            fetchFn: ({ entityIds }) =>
              k2kGatewayApi
                .getEservices({
                  client: k2kGatewayClient,
                  query: {
                    eserviceId: entityIds,
                    limit: entityIds.length,
                    offset: 0,
                  },
                })
                .then((res) => res.data.results),
            getEntityId: (agreement) => agreement.eserviceId,
            items: consumerAgreements.results,
            knodeId: targetKnodeId,
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
            items: consumerAgreements.results,
            knodeId: targetKnodeId,
          }),
        ]);

      return {
        pagination: consumerAgreements.pagination,
        results: await Promise.all(
          consumerAgreements.results.map(async (agreement) =>
            toAPI_Eservice({
              agreement,
              eservice: assertEntityExists(
                eservicesMap.get(unsafeBrandExternalId(agreement.eserviceId)),
                `E-service ${agreement.eserviceId} owned by Knode ${targetKnodeId} not found for Agreement ${agreement.id}`,
              ),
              eserviceVersion: assertEntityExists(
                eserviceVersionsMap.get(
                  unsafeBrandExternalId(agreement.eserviceVersionId),
                ),
                `E-service version for E-service ${agreement.eserviceId} owned by Knode ${targetKnodeId} not found for Agreement ${agreement.id}`,
              ),
              producer: {
                ...assertEntityExists(
                  producersMap.get(unsafeBrandExternalId(agreement.producerId)),
                  `Producer Organization ${agreement.producerId} owned by Knode ${targetKnodeId} not found for Agreement ${agreement.id}`,
                ),
                knodeId: targetKnodeId,
              },
            }),
          ),
        ),
      };
    },
  };
}
