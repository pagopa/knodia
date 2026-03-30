import type { ExternalId } from "@knodia/common-models/externalResource";
import type { KnodeId, PurposeId } from "@knodia/common-models/ids";
import type { RemoteResourceDbService } from "@knodia/db-remote-resource/services";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { PurposeFormSchemaVersion } from "@knodia/purpose-models";

import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";

import type {
  API_CreatedPurposeResource,
  API_Purpose,
  API_PurposeSeed,
} from "../models/purpose/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import { purposeNotFound } from "../models/errors.ts";
import { toAPI_Purpose } from "../models/purpose/apiConverter.ts";
import { retrieveOrganization } from "../utils/readmodelUtils.ts";

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
        formSchemaVersion,
        knodeId,
        name,
      } = reqBody;
      const { organizationId: consumerId } = authData;

      logger.info(
        { requestBody: reqBody },
        `Creating purpose for e-service owned by Knode ${knodeId} with body data`,
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
    async getPurpose(
      {
        knodeId,
        purposeId,
      }: {
        knodeId: KnodeId;
        purposeId: ExternalId<PurposeId>;
      },
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Purpose> {
      logger.info(`Getting Purpose ${purposeId} from Knode ${knodeId}`);

      const remotePurpose = await remoteResourceDbService.getPurposeById(
        purposeId,
        knodeId,
      );

      if (!remotePurpose) {
        throw purposeNotFound(purposeId);
      }

      const { data } = await k2kGatewayApi.getPurpose({
        client: k2kGatewayClient,
        path: { purposeId },
      });

      return toAPI_Purpose(data);}),
    async getPurposeFormSchema(
      version: PurposeFormSchemaVersion,
      knodeId: KnodeId,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<Record<string, unknown>> {
      logger.info(
        `Getting Purpose form schema version ${version} from Knode ${knodeId}`,
      );
      const { data } = await k2kGatewayApi.getPurposeFormSchema({
        client: k2kGatewayClient,
        path: { version },
      });
      return data;
    },
    async getPurposeFormUiSchema(
      version: PurposeFormSchemaVersion,
      knodeId: KnodeId,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<Record<string, unknown>> {
      logger.info(
        `Getting Purpose form UI schema version ${version} from Knode ${knodeId}`,
      );
      const { data } = await k2kGatewayApi.getPurposeFormUiSchema({
        client: k2kGatewayClient,
        path: { version },
      });
      return data;
    },
  };
}
