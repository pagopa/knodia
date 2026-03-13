import type { ExternalResource } from "@knodia/common-models/externalResource";
import type { RemoteResourceDbService } from "@knodia/db-remote-resource/services";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import { parseContentDispositionFileName } from "@knodia/fastify-zod-api-commons/http";
import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";

import type {
  API_CatalogEserviceSearchResults,
  API_ConsumerEservice,
  API_ConsumerEservices,
  API_EserviceDetails,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
  API_GetConsumerEservicesQueryParams,
} from "../models/eservice/api.ts";

import { toAPI_AgreementState } from "../models/agreement/apiConverter.ts";
import {
  toAPI_CatalogEserviceSearchResult,
  toAPI_EserviceDetails,
  toAPI_EserviceMode,
  toAPI_EserviceVersionState,
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

      return {
        pagination: data.pagination,
        results: data.results.map(toAPI_CatalogEserviceSearchResult),
      };
    },

    async getConsumerEservices(
      reqQuery: API_GetConsumerEservicesQueryParams,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_ConsumerEservices> {
      logger.info(
        { requestQuery: reqQuery },
        `Getting Consumer E-services with query parameters`,
      );

      const { agreementState, consumerId, limit, offset } = reqQuery;

      const remoteAgreements =
        await remoteResourceDbService.getAgreementsByConsumerId({
          consumerId: unsafeBrandId(consumerId),
          limit: limit,
          offset: offset,
        });

      const results: API_ConsumerEservice[] = (
        await Promise.all(
          remoteAgreements.results.map(async (remoteAgreement) => {
            const [
              { data: agreement },
              { data: eservice },
              { data: eserviceVersion },
            ] = await Promise.all([
              k2kGatewayApi.getAgreement({
                client: k2kGatewayClient,
                path: { agreementId: remoteAgreement.agreementId },
              }),
              k2kGatewayApi.getEservice({
                client: k2kGatewayClient,
                path: { eserviceId: remoteAgreement.eserviceId },
              }),
              // TODO: this should use getEserviceVersion instead
              k2kGatewayApi.getEserviceLatestVersion({
                client: k2kGatewayClient,
                path: { eserviceId: remoteAgreement.eserviceId },
              }),
              // TODO: get producer with remoteAgreement.producerId
            ]);

            const apiAgreementState = toAPI_AgreementState(agreement.state);
            if (agreementState && apiAgreementState !== agreementState) {
              return null;
            }

            const hasRecentlyBeenUpdated = (dateString: string): boolean => {
              const updatedAt = new Date(dateString);
              const threeDaysAgo = new Date();
              threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

              return updatedAt >= threeDaysAgo;
            };

            return {
              agreement: {
                id: agreement.id,
                state: apiAgreementState,
              },
              categories: eservice.categories,
              hasRecentlyBeenUpdated: hasRecentlyBeenUpdated(
                eservice.updatedAt,
              ),
              id: eservice.id,
              mode: toAPI_EserviceMode(eservice.mode),
              name: eservice.name,
              producer: {
                id: eservice.producerId,
                knodeId: API_KnodeId.parse(remoteAgreement.knodeId),
                name: "Producer Name", // TODO: get producer name with remoteAgreement.producerId
              },
              version: {
                id: eserviceVersion.id,
                requiredAttributes: eserviceVersion.requiredAttributes,
                state: toAPI_EserviceVersionState(eserviceVersion.state),
              },
            } satisfies API_ConsumerEservice;
          }),
        )
      ).filter((x): x is API_ConsumerEservice => x !== null);

      return {
        pagination: {
          limit: limit,
          offset: offset,
          total: remoteAgreements.totalCount,
        },
        results,
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

      return toAPI_EserviceDetails(eservice, version);
    },
  };
}
