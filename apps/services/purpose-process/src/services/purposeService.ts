import type { ExternalResource } from "@knodia/common-models/externalResource";
import type { PurposeEventStoreWriter } from "@knodia/db-event-store-writer/purpose";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type {
  AuthData,
  InternalAuthData,
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

import type { ReadmodelService } from "./readmodelService.ts";

import { getFormSchema, getFormUiSchema } from "../models/formSchemas.ts";
import { createPurposeActivatedV1Event } from "../models/purposeEventFactory.ts";
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
) {
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

      // TODO form answers validation against the Knode purpose form JSON schema

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
    getFormSchema(version: PurposeFormSchemaVersion): Record<string, unknown> {
      return getFormSchema(version);
    },
    getFormUiSchema(
      version: PurposeFormSchemaVersion,
    ): Record<string, unknown> {
      return getFormUiSchema(version);
    },
    async getPurpose(
      purposeId: PurposeId,
      { logger }: AuthorizedContext<AuthData>,
    ): Promise<WithMetadata<Purpose>> {
      logger.info(`Getting Purpose with ID ${purposeId}`);

      return await retrievePurpose(purposeId, readmodelService);
    },
  };
}
