import type { ExternalResource } from "@knodia/common-models/externalResource";
import type { EserviceId } from "@knodia/common-models/ids";
import type { RemoteResourceDbService } from "@knodia/db-remote-resource/services";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import { parseContentDispositionFileName } from "@knodia/fastify-zod-api-commons/http";
import { genericError } from "@knodia/fastify-zod-api-commons/models";
import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";

import type {
  API_CatalogEserviceSearchResults,
  API_EserviceDetails,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
} from "../models/eservice/api.ts";

import {
  toAPI_CatalogEserviceSearchResult,
  toAPI_EserviceDetails,
} from "../models/eservice/apiConverter.ts";

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

      const uniqueProducerIds = [
        ...new Set(data.results.map((r) => r.producerId)),
      ];

      const organizations = await Promise.all(
        uniqueProducerIds.map((organizationId) =>
          k2kGatewayApi.getOrganization({
            client: k2kGatewayClient,
            path: { organizationId },
          }),
        ),
      );

      const producerNamesMap = new Map(
        organizations.map(({ data: org }) => [org.id, org.name]),
      );

      return {
        pagination: data.pagination,
        results: data.results.map((r) => {
          const producerName = producerNamesMap.get(r.producerId);
          if (!producerName) {
            throw genericError(
              `Producer Organization ${r.producerId} not found for E-service ${r.id}`,
            );
          }
          return toAPI_CatalogEserviceSearchResult(r, producerName);
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

      const path = { eserviceId: eserviceId.id };

      const [{ data: eservice }, { data: version }, remoteAgreements] =
        await Promise.all([
          k2kGatewayApi.getEservice({
            client: k2kGatewayClient,
            path,
          }),
          k2kGatewayApi.getEserviceLatestVersion({
            client: k2kGatewayClient,
            path,
          }),
          remoteResourceDbService.getAgreementsByConsumerIdAndEserviceId(
            authData.organizationId,
            eserviceId.id,
            eserviceId.knodeId,
          ),
        ]);

      const remoteAgreement = remoteAgreements[0];

      if (remoteAgreements.length > 1) {
        logger.warn(
          {
            consumerId: authData.organizationId,
            count: remoteAgreements.length,
            eserviceId: eserviceId.id,
            knodeId: eserviceId.knodeId,
          },
          `Multiple agreements found for consumer and eservice for Knode: ${eserviceId.knodeId}`,
        );
      }

      const [{ data: producer }, agreement] = await Promise.all([
        k2kGatewayApi.getOrganization({
          client: k2kGatewayClient,
          path: { organizationId: eservice.producerId },
        }),
        remoteAgreement
          ? k2kGatewayApi
              .getAgreement({
                client: k2kGatewayClient,
                path: { agreementId: remoteAgreement.agreementId },
              })
              .then(({ data }) => data)
          : Promise.resolve(undefined),
      ]);

      return toAPI_EserviceDetails(eservice, version, producer, agreement);
    },
  };
}
