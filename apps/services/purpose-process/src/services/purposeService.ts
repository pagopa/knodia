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
  type PurposeFormOptionId,
  type PurposeId,
  type PurposeTemplateId,
} from "@knodia/common-models/ids";
import { type EserviceMode } from "@knodia/eservice-models";
import {
  type LocalizedPurposeDescription,
  type LocalizedPurposeName,
  type Purpose,
  PurposeActor,
  type PurposeFormAnswers,
  type PurposeFormSchemaVersion,
  PurposeState,
} from "@knodia/purpose-models";
import { match } from "ts-pattern";

import type {
  API_GetPurposesQueryParams,
  API_GetTotalDailyCallsQueryParams,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import { purposeFormOptionNotFound } from "../models/errors.ts";
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
  assertReceiveDataConfigIsDefined,
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
interface CreatePurposeForProvideDataInput extends CreatePurposeInputBase {
  eserviceMode: typeof EserviceMode.enum.ProvideData;
  formAnswersJson: PurposeFormAnswers;
  formSchemaVersion: PurposeFormSchemaVersion;
  template?: ExternalResource<PurposeTemplateId>;
}

interface CreatePurposeForReceiveDataInput extends CreatePurposeInputBase {
  eserviceMode: typeof EserviceMode.enum.ReceiveData;
  purposeFormOptionId: PurposeFormOptionId;
}

type CreatePurposeInput =
  | CreatePurposeForProvideDataInput
  | CreatePurposeForReceiveDataInput;

interface CreatePurposeInputBase {
  consumer: ExternalResource<OrganizationId>;
  dailyCalls: number;
  description: LocalizedPurposeDescription;
  eserviceId: EserviceId;
  name: LocalizedPurposeName;
}

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
      seed: CreatePurposeInput,
      { correlationId, logger }: AuthorizedContext<InternalAuthData>,
    ): Promise<WithMetadata<Purpose>> {
      const purposeId = generateId<PurposeId>();
      logger.info(
        {
          requestBody: {
            consumer: seed.consumer,
            eserviceId: seed.eserviceId,
            eserviceMode: seed.eserviceMode,
            name: seed.name,
          },
        },
        `Creating Purpose ${purposeId}`,
      );

      const eservice = await retrieveEservice(
        seed.eserviceId,
        readmodelService,
      );
      assertEserviceModeIs(eservice, seed.eserviceMode);
      assertEserviceAllowsPurposeCreation(eservice);

      const agreements = await retrieveAgreements({
        consumerId: seed.consumer.id,
        consumerKnodeId: seed.consumer.knodeId,
        eserviceId: seed.eserviceId,
        readmodelService,
      });
      assertAgreementAllowsPurposeCreation({
        agreements,
        consumerId: seed.consumer.id,
        consumerKnodeId: seed.consumer.knodeId,
        eserviceId: seed.eserviceId,
      });

      // Form answers come from the request body in ProvideData mode and from
      // the Producer-published PurposeFormOption in ReceiveData mode. The
      // schema validation runs after the formData is resolved: in ReceiveData
      // mode it acts as a safety net against malformed form options that may
      // slip past Producer-side validation.
      const formData = match(seed)
        .with({ eserviceMode: "ProvideData" }, (s) => ({
          formAnswersJson: s.formAnswersJson,
          formSchemaVersion: s.formSchemaVersion,
          template: s.template,
        }))
        .with({ eserviceMode: "ReceiveData" }, (s) => {
          assertReceiveDataConfigIsDefined(eservice);
          const option = eservice.receiveDataConfig.purposeFormOptions.find(
            (p) => p.id === s.purposeFormOptionId,
          );
          if (option === undefined) {
            throw purposeFormOptionNotFound(eservice.id, s.purposeFormOptionId);
          }
          return {
            formAnswersJson: option.formAnswersJson,
            formSchemaVersion: option.formSchemaVersion,
            template: undefined,
          };
        })
        .exhaustive();

      assertFormAnswersAreValid(
        formData.formAnswersJson,
        formData.formSchemaVersion,
      );

      const now = new Date();
      const purpose: Purpose = {
        consumer: seed.consumer,
        createdAt: now,
        dailyCalls: seed.dailyCalls,
        description: seed.description,
        eserviceId: seed.eserviceId,
        formAnswersJson: formData.formAnswersJson,
        formSchemaVersion: formData.formSchemaVersion,
        id: purposeId,
        name: seed.name,
        state: PurposeState.enum.Active,
        suspendedByConsumerAt: null,
        suspendedByProducerAt: null,
        // Template existence is not validated: purpose templates are a hardcoded set (cfr. KN-561).
        template: formData.template,
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
