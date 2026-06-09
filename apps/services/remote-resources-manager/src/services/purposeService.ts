/* eslint-disable max-lines-per-function */
import type { ExternalId } from "@knodia/common-models/externalResource";
import type { RemoteResourceDbService } from "@knodia/db-remote-resource/services";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { K2K2GatewayApiClientFactory } from "@knodia/k2k-gateway-client/factory";

import {
  type EserviceId,
  type KnodeId,
  type OrganizationId,
  type PurposeId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import type {
  API_CreatedPurposeResource,
  API_GetPurposesQueryParams,
  API_Purpose,
  API_Purposes,
  API_PurposeSeed,
} from "../models/purpose/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import { multiKnodeListingNotSupported } from "../models/errors.ts";
import { toK2KAPI_KnodeId } from "../models/knode/apiConverter.ts";
import {
  toAPI_Purpose,
  toK2KAPI_PurposeState,
} from "../models/purpose/apiConverter.ts";
import { retrieveOrganization } from "../utils/readmodelUtils.ts";
import {
  assertOrganizationIsPurposeConsumer,
  assertPurposeExists,
} from "../utils/validators.ts";

export type PurposeService = ReturnType<typeof purposeServiceBuilder>;

export function purposeServiceBuilder(
  getK2K2GatewayApiClient: K2K2GatewayApiClientFactory,
  remoteResourceDbService: RemoteResourceDbService,
  readmodelService: ReadmodelService,
) {
  return {
    async archivePurpose(
      purposeId: ExternalId<PurposeId>,
      targetKnodeId: KnodeId,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Purpose> {
      logger.info(`Archiving Purpose ${purposeId} on Knode ${targetKnodeId}`);

      await verifyConsumerCanActOnPurpose(
        purposeId,
        targetKnodeId,
        authData.organizationId,
        remoteResourceDbService,
        readmodelService,
      );

      const { data } = await k2kGatewayApi.archivePurpose({
        client: getK2K2GatewayApiClient(targetKnodeId),
        path: { purposeId },
      });

      return toAPI_Purpose(data, targetKnodeId);
    },

    async createPurpose(
      reqBody: API_PurposeSeed,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_CreatedPurposeResource> {
      const {
        dailyCalls,
        description,
        eserviceId,
        formAnswersJson,
        formSchemaVersion,
        knodeId: targetKnodeId,
        name,
        template,
      } = reqBody;
      const { organizationId: consumerId } = authData;

      logger.info(
        { requestBody: reqBody },
        `Creating purpose for e-service owned by Knode ${targetKnodeId} with body data`,
      );

      await retrieveOrganization(consumerId, readmodelService);

      const { data } = await k2kGatewayApi.createPurpose({
        body: {
          consumerId,
          dailyCalls,
          description,
          eserviceId,
          formAnswersJson,
          formSchemaVersion,
          name,
          template: template
            ? { id: template.id, knodeId: toK2KAPI_KnodeId(template.knodeId) }
            : undefined,
        },
        client: getK2K2GatewayApiClient(targetKnodeId),
      });

      await remoteResourceDbService.insertPurpose({
        consumerId,
        eserviceId,
        knodeId: targetKnodeId,
        purposeId: data.id,
      });

      return data;
    },
    async getCurrentPurposeFormSchemas(
      targetKnodeId: KnodeId,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<{
      schema: Record<string, unknown>;
      texts: { en: Record<string, string> };
      uiSchema: Record<string, unknown>;
      uiTexts: { en: Record<string, string> };
      version: string;
    }> {
      logger.info(
        `Getting current Purpose form schemas from Knode ${targetKnodeId}`,
      );
      const { data } = await k2kGatewayApi.getCurrentPurposeFormSchemas({
        client: getK2K2GatewayApiClient(targetKnodeId),
      });
      return data;
    },
    async getPurpose(
      {
        purposeId,
        targetKnodeId,
      }: {
        purposeId: ExternalId<PurposeId>;
        targetKnodeId: KnodeId;
      },
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Purpose> {
      logger.info(`Getting Purpose ${purposeId} from Knode ${targetKnodeId}`);

      const remotePurpose = await remoteResourceDbService.getPurposeById(
        purposeId,
        targetKnodeId,
      );

      assertPurposeExists(remotePurpose, purposeId);

      const { data } = await k2kGatewayApi.getPurpose({
        client: getK2K2GatewayApiClient(targetKnodeId),
        path: { purposeId },
      });

      return toAPI_Purpose(data, targetKnodeId);
    },

    async getPurposes(
      requestQuery: API_GetPurposesQueryParams,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Purposes> {
      logger.info({ requestQuery }, "Getting Purposes with query params");

      const { eserviceId, limit, offset, state } = requestQuery;
      const consumerId = authData.organizationId;

      // Provisional (KN-589): single-knode listing — fail fast if more than one knode appears.
      const knodesWithPurposes =
        await remoteResourceDbService.getPurposesDistinctKnodes(
          consumerId,
          eserviceId === undefined
            ? undefined
            : unsafeBrandId<EserviceId>(eserviceId),
        );
      if (knodesWithPurposes.length > 1) {
        throw multiKnodeListingNotSupported(knodesWithPurposes);
      }
      const [targetKnodeId] = knodesWithPurposes;
      if (targetKnodeId === undefined) {
        return { pagination: { limit, offset, total: 0 }, results: [] };
      }

      logger.info(
        `Getting Purposes from Knode ${targetKnodeId} for consumer ${consumerId}`,
      );

      const { data } = await k2kGatewayApi.getPurposes({
        client: getK2K2GatewayApiClient(targetKnodeId),
        query: {
          consumerId,
          eserviceId,
          limit,
          offset,
          state: state?.map(toK2KAPI_PurposeState),
        },
      });

      return {
        pagination: data.pagination,
        results: data.results.map((purpose) =>
          toAPI_Purpose(purpose, targetKnodeId),
        ),
      };
    },

    async reactivatePurpose(
      purposeId: ExternalId<PurposeId>,
      targetKnodeId: KnodeId,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Purpose> {
      logger.info(
        `Reactivating Purpose ${purposeId} on Knode ${targetKnodeId}`,
      );

      await verifyConsumerCanActOnPurpose(
        purposeId,
        targetKnodeId,
        authData.organizationId,
        remoteResourceDbService,
        readmodelService,
      );

      const { data } = await k2kGatewayApi.reactivatePurpose({
        client: getK2K2GatewayApiClient(targetKnodeId),
        path: { purposeId },
      });

      return toAPI_Purpose(data, targetKnodeId);
    },

    async suspendPurpose(
      purposeId: ExternalId<PurposeId>,
      targetKnodeId: KnodeId,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Purpose> {
      logger.info(`Suspending Purpose ${purposeId} on Knode ${targetKnodeId}`);

      await verifyConsumerCanActOnPurpose(
        purposeId,
        targetKnodeId,
        authData.organizationId,
        remoteResourceDbService,
        readmodelService,
      );

      const { data } = await k2kGatewayApi.suspendPurpose({
        client: getK2K2GatewayApiClient(targetKnodeId),
        path: { purposeId },
      });

      return toAPI_Purpose(data, targetKnodeId);
    },
  };
}

async function verifyConsumerCanActOnPurpose(
  purposeId: ExternalId<PurposeId>,
  targetKnodeId: KnodeId,
  organizationId: OrganizationId,
  remoteResourceDbService: RemoteResourceDbService,
  readmodelService: ReadmodelService,
): Promise<void> {
  await retrieveOrganization(organizationId, readmodelService);

  const remotePurpose = await remoteResourceDbService.getPurposeById(
    purposeId,
    targetKnodeId,
  );

  assertPurposeExists(remotePurpose, purposeId);
  assertOrganizationIsPurposeConsumer(remotePurpose, purposeId, organizationId);
}
