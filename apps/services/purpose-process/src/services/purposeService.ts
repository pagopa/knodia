import type { ExternalResource } from "@knodia/common-models/externalResource";
import type { PurposeEventStoreWriter } from "@knodia/db-event-store-writer/purpose";
import type {
  ListResult,
  WithMetadata,
} from "@knodia/db-readmodel-commons/models";
import type {
  AuthData,
  InternalAuthData,
  UISessionAuthData,
} from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import {
  type EserviceId,
  generateId,
  type OrganizationId,
  type PurposeId,
} from "@knodia/common-models/ids";
import { EserviceMode } from "@knodia/eservice-models";
import {
  type LocalizedPurposeDescription,
  type LocalizedPurposeName,
  type Purpose,
  type PurposeFormAnswers,
  type PurposeFormSchemaVersion,
  PurposeState,
} from "@knodia/purpose-models";

import type {
  API_GetPurposesQueryParams,
  API_GetTotalDailyCallsQueryParams,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  CURRENT_FORM_SCHEMA_VERSION,
  type GetFormSchemas,
} from "../models/formSchemas.ts";
import { createPurposeActivatedV1Event } from "../models/purposeEventFactory.ts";
import { buildFormAnswersValidator } from "../utils/formAnswersValidator.ts";
import {
  retrieveAgreements,
  retrieveEservice,
  retrievePurpose,
} from "../utils/readmodelUtils.ts";
import {
  assertAgreementAllowsPurposeCreation,
  assertEserviceAllowsPurposeCreation,
  assertEserviceModeIs,
} from "../utils/validators.ts";

export type PurposeService = ReturnType<typeof purposeServiceBuilder>;

export function purposeServiceBuilder(
  eventStoreWriter: PurposeEventStoreWriter,
  readmodelService: ReadmodelService,
  getFormSchemas: GetFormSchemas,
) {
  const assertFormAnswersAreValid = buildFormAnswersValidator(getFormSchemas);
  return {
    async createPurpose(
      {
        consumer,
        dailyCalls,
        description,
        eserviceId,
        formAnswersJson,
        formSchemaVersion,
        name,
      }: {
        consumer: ExternalResource<OrganizationId>;
        dailyCalls: number;
        description: LocalizedPurposeDescription;
        eserviceId: EserviceId;
        formAnswersJson: PurposeFormAnswers;
        formSchemaVersion: PurposeFormSchemaVersion;
        name: LocalizedPurposeName;
      },
      { correlationId, logger }: AuthorizedContext<InternalAuthData>,
    ): Promise<WithMetadata<Purpose>> {
      const purposeId = generateId<PurposeId>();
      logger.info(
        { requestBody: { consumer, eserviceId, name } },
        `Creating Purpose ${purposeId}`,
      );

      const eservice = await retrieveEservice(eserviceId, readmodelService);
      assertEserviceModeIs(eservice, EserviceMode.enum.ProvideData);
      assertEserviceAllowsPurposeCreation(eservice);

      const agreements = await retrieveAgreements({
        consumerId: consumer.id,
        consumerKnodeId: consumer.knodeId,
        eserviceId,
        readmodelService,
      });
      assertAgreementAllowsPurposeCreation({
        agreements,
        consumerId: consumer.id,
        consumerKnodeId: consumer.knodeId,
        eserviceId,
      });

      assertFormAnswersAreValid(formAnswersJson, formSchemaVersion);

      const now = new Date();
      const purpose: Purpose = {
        consumer,
        createdAt: now,
        dailyCalls,
        description,
        eserviceId,
        formAnswersJson,
        formSchemaVersion,
        id: purposeId,
        name,
        state: PurposeState.enum.Active,
        updatedAt: now,
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createPurposeActivatedV1Event(purpose, correlationId),
      );

      return {
        data: purpose,
        metadata: { version: newVersion },
      };
    },
    getCurrentPurposeFormSchemas({ logger }: AuthorizedContext<AuthData>): {
      schema: Record<string, unknown>;
      texts: { en: Record<string, string> };
      uiSchema: Record<string, unknown>;
      uiTexts: { en: Record<string, string> };
      version: PurposeFormSchemaVersion;
    } {
      logger.info("Getting current Purpose form schemas");
      return {
        ...getFormSchemas(CURRENT_FORM_SCHEMA_VERSION),
        version: CURRENT_FORM_SCHEMA_VERSION,
      };
    },
    async getPurpose(
      purposeId: PurposeId,
      { logger }: AuthorizedContext<AuthData>,
    ): Promise<WithMetadata<Purpose>> {
      logger.info(`Getting Purpose with ID ${purposeId}`);

      return await retrievePurpose(purposeId, readmodelService);
    },
    async getPurposes(
      requestQuery: API_GetPurposesQueryParams,
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<ListResult<Purpose>> {
      logger.info({ requestQuery }, "Getting Purposes with query params");
      return await readmodelService.getPurposes(requestQuery);
    },
    async getTotalDailyCalls(
      requestQuery: API_GetTotalDailyCallsQueryParams,
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<number> {
      logger.info(
        { requestQuery },
        "Getting total daily calls for Purposes with query params",
      );
      return await readmodelService.getTotalDailyCalls(requestQuery);
    },
  };
}
