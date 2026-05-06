/* eslint-disable max-lines-per-function */
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
  type PurposeTemplateId,
} from "@knodia/common-models/ids";
import { EserviceMode } from "@knodia/eservice-models";
import {
  type LocalizedPurposeDescription,
  type LocalizedPurposeName,
  type Purpose,
  PurposeActor,
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
import {
  createPurposeActivatedV1Event,
  createPurposeArchivedV1Event,
  createPurposeReactivatedByConsumerV1Event,
  createPurposeReactivatedByProducerV1Event,
  createPurposeSuspendedByConsumerV1Event,
  createPurposeSuspendedByProducerV1Event,
} from "../models/purposeEventFactory.ts";
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
  assertOrganizationIsPurposeProducer,
  assertPurposeCanBeReactivatedBy,
  assertPurposeCanBeSuspendedBy,
  assertPurposeIsSuspended,
} from "../utils/validators.ts";

export type PurposeService = ReturnType<typeof purposeServiceBuilder>;

// Only the Producer calls via ui-session (from their own knode) and only the
// Consumer calls via an internal k2k token (from RRM). This union makes the
// other two pairings unrepresentable at the type level.
type CallerIdentity =
  | {
      actor: typeof PurposeActor.enum.Consumer;
      ctx: AuthorizedContext<InternalAuthData>;
    }
  | {
      actor: typeof PurposeActor.enum.Producer;
      ctx: AuthorizedContext<UISessionAuthData>;
    };

export function purposeServiceBuilder(
  eventStoreWriter: PurposeEventStoreWriter,
  readmodelService: ReadmodelService,
  getFormSchemas: GetFormSchemas,
) {
  const assertFormAnswersAreValid = buildFormAnswersValidator(getFormSchemas);
  return {
    async archivePurpose(
      purposeId: PurposeId,
      { correlationId, logger }: AuthorizedContext<InternalAuthData>,
    ): Promise<WithMetadata<Purpose>> {
      logger.info(`Archiving Purpose ${purposeId}`);

      const { data: purpose, metadata } = await retrievePurpose(
        purposeId,
        readmodelService,
      );

      // Only the consumer can archive a purpose.
      // Purpose must be in Suspended state.
      assertPurposeIsSuspended(purpose);

      const now = new Date();
      const updatedPurpose: Purpose = {
        ...purpose,
        state: PurposeState.enum.Archived,
        updatedAt: now,
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createPurposeArchivedV1Event(
          updatedPurpose,
          metadata.version,
          correlationId,
        ),
      );

      return { data: updatedPurpose, metadata: { version: newVersion } };
    },
    async createPurpose(
      {
        consumer,
        dailyCalls,
        description,
        eserviceId,
        formAnswersJson,
        formSchemaVersion,
        name,
        template,
      }: {
        consumer: ExternalResource<OrganizationId>;
        dailyCalls: number;
        description: LocalizedPurposeDescription;
        eserviceId: EserviceId;
        formAnswersJson: PurposeFormAnswers;
        formSchemaVersion: PurposeFormSchemaVersion;
        name: LocalizedPurposeName;
        template?: ExternalResource<PurposeTemplateId>;
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
        suspendedByConsumerAt: null,
        suspendedByProducerAt: null,
        ...(template ? { template } : {}),
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
    async reactivatePurpose(
      purposeId: PurposeId,
      caller: CallerIdentity,
    ): Promise<WithMetadata<Purpose>> {
      const {
        actor,
        ctx: { correlationId, logger },
      } = caller;
      logger.info(`Reactivating Purpose ${purposeId} by ${actor}`);

      const { data: purpose, metadata } = await retrievePurpose(
        purposeId,
        readmodelService,
      );

      // Consumer calls arrive via an internal k2k token from RRM; RRM is
      // responsible for the caller=consumer check on its side before
      // issuing the downstream call, so we only verify the producer here.
      if (caller.actor === PurposeActor.enum.Producer) {
        const eservice = await retrieveEservice(
          purpose.eserviceId,
          readmodelService,
        );
        assertOrganizationIsPurposeProducer(
          eservice,
          purpose.id,
          caller.ctx.authData.organizationId,
        );
      }

      assertPurposeCanBeReactivatedBy(purpose, actor);

      const now = new Date();
      const suspendedByConsumerAt =
        actor === PurposeActor.enum.Consumer
          ? null
          : purpose.suspendedByConsumerAt;
      const suspendedByProducerAt =
        actor === PurposeActor.enum.Producer
          ? null
          : purpose.suspendedByProducerAt;
      const nextState: PurposeState =
        suspendedByConsumerAt === null && suspendedByProducerAt === null
          ? PurposeState.enum.Active
          : PurposeState.enum.Suspended;

      const updatedPurpose: Purpose = {
        ...purpose,
        state: nextState,
        suspendedByConsumerAt,
        suspendedByProducerAt,
        updatedAt: now,
      };

      const eventFactory =
        actor === PurposeActor.enum.Producer
          ? createPurposeReactivatedByProducerV1Event
          : createPurposeReactivatedByConsumerV1Event;

      const { newVersion } = await eventStoreWriter.insertEvent(
        eventFactory(updatedPurpose, metadata.version, correlationId),
      );

      return { data: updatedPurpose, metadata: { version: newVersion } };
    },
    async suspendPurpose(
      purposeId: PurposeId,
      caller: CallerIdentity,
    ): Promise<WithMetadata<Purpose>> {
      const {
        actor,
        ctx: { correlationId, logger },
      } = caller;
      logger.info(`Suspending Purpose ${purposeId} by ${actor}`);

      const { data: purpose, metadata } = await retrievePurpose(
        purposeId,
        readmodelService,
      );

      // Producer authorization runs before the state-transition check so
      // unauthorized callers get 403 instead of leaking 409 state info.
      // Consumer calls arrive via an internal k2k token from RRM; RRM is
      // responsible for the caller=consumer check on its side before
      // issuing the downstream call, so we only verify the producer here.
      if (caller.actor === PurposeActor.enum.Producer) {
        const eservice = await retrieveEservice(
          purpose.eserviceId,
          readmodelService,
        );
        assertOrganizationIsPurposeProducer(
          eservice,
          purpose.id,
          caller.ctx.authData.organizationId,
        );
      }

      assertPurposeCanBeSuspendedBy(purpose, actor);

      const now = new Date();
      const updatedPurpose: Purpose = {
        ...purpose,
        state: PurposeState.enum.Suspended,
        suspendedByConsumerAt:
          actor === PurposeActor.enum.Consumer
            ? now
            : purpose.suspendedByConsumerAt,
        suspendedByProducerAt:
          actor === PurposeActor.enum.Producer
            ? now
            : purpose.suspendedByProducerAt,
        updatedAt: now,
      };

      const eventFactory =
        actor === PurposeActor.enum.Producer
          ? createPurposeSuspendedByProducerV1Event
          : createPurposeSuspendedByConsumerV1Event;

      const { newVersion } = await eventStoreWriter.insertEvent(
        eventFactory(updatedPurpose, metadata.version, correlationId),
      );

      return { data: updatedPurpose, metadata: { version: newVersion } };
    },
  };
}
