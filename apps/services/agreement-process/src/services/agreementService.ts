/* eslint-disable max-lines-per-function */
import type { AttributeId } from "@knodia/attribute-models";
import type { ExternalResource } from "@knodia/common-models/externalResource";
import type { AgreementEventStoreWriter } from "@knodia/db-event-store-writer/agreement";
import type {
  ListResult,
  WithMetadata,
} from "@knodia/db-readmodel-commons/models";
import type {
  ExternalUISessionAuthData,
  InternalAuthData,
  UISessionAuthData,
} from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import {
  type Agreement,
  AgreementActor,
  AgreementState,
} from "@knodia/agreement-models";
import {
  type AgreementId,
  type EserviceId,
  type EserviceVersionId,
  generateId,
  type OrganizationId,
} from "@knodia/common-models/ids";

import type { API_GetAgreementsQueryParams } from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  createAgreementActivatedByConsumerOperatorV1Event,
  createAgreementActivatedV1Event,
  createAgreementCreatedPendingConsumerOperatorIdentificationV1Event,
  createAgreementReactivatedByConsumerV1Event,
  createAgreementReactivatedByProducerV1Event,
  createAgreementSuspendedByConsumerV1Event,
  createAgreementSuspendedByProducerV1Event,
} from "../models/agreementEventFactory.ts";
import {
  retrieveAgreement,
  retrieveEservice,
} from "../utils/readmodelUtils.ts";
import {
  assertAgreementCanBeReactivatedBy,
  assertAgreementCanBeSuspendedBy,
  assertAgreementIsPendingConsumerOperatorIdentification,
  assertConsumerHasRequiredAttributes,
  assertEserviceVersionAllowsAgreementCreation,
  assertEserviceVersionIsLatest,
  assertNoConflictingAgreementsExist,
  assertOrganizationIsAgreementProducer,
  assertTokenAgreementIdMatchesPathParam,
  assertTokenResourceClaimsMatchAgreement,
} from "../utils/validators.ts";

export type AgreementService = ReturnType<typeof agreementServiceBuilder>;

// Only the Producer calls via ui-session (from their own knode) and only the
// Consumer calls via an internal k2k token (from RRM). This union makes the
// other two pairings unrepresentable at the type level.
type CallerIdentity =
  | {
      actor: typeof AgreementActor.enum.Consumer;
      ctx: AuthorizedContext<InternalAuthData>;
    }
  | {
      actor: typeof AgreementActor.enum.Producer;
      ctx: AuthorizedContext<UISessionAuthData>;
    };

export function agreementServiceBuilder(
  eventStoreWriter: AgreementEventStoreWriter,
  readmodelService: ReadmodelService,
) {
  return {
    async activateAgreement(
      agreementId: AgreementId,
      {
        authData,
        correlationId,
        logger,
      }: AuthorizedContext<ExternalUISessionAuthData>,
    ): Promise<WithMetadata<Agreement>> {
      logger.info(`Activating Agreement ${agreementId}`);

      assertTokenAgreementIdMatchesPathParam(authData.agreementId, agreementId);

      const {
        data: agreement,
        metadata: { version },
      } = await retrieveAgreement(agreementId, readmodelService);

      assertTokenResourceClaimsMatchAgreement(authData, agreement);
      assertAgreementIsPendingConsumerOperatorIdentification(agreement);

      const updatedAgreement: Agreement = {
        ...agreement,
        state: AgreementState.enum.Active,
        updatedAt: new Date(),
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createAgreementActivatedByConsumerOperatorV1Event(
          updatedAgreement,
          version,
          correlationId,
        ),
      );

      return { data: updatedAgreement, metadata: { version: newVersion } };
    },
    async createAgreement(
      {
        consumer,
        consumerAttributes,
        eserviceId,
        eserviceVersionId,
      }: {
        consumer: ExternalResource<OrganizationId>;
        consumerAttributes: AttributeId[];
        eserviceId: EserviceId;
        eserviceVersionId: EserviceVersionId;
      },
      { correlationId, logger }: AuthorizedContext<InternalAuthData>,
    ): Promise<WithMetadata<Agreement>> {
      const agreementId = generateId<AgreementId>();
      logger.info(
        { requestBody: { consumer, eserviceId, eserviceVersionId } },
        `Creating Agreement ${agreementId}`,
      );

      await assertNoConflictingAgreementsExist({
        consumerId: consumer.id,
        consumerKnodeId: consumer.knodeId,
        eserviceId,
        readmodelService,
      });

      const eservice = await retrieveEservice(eserviceId, readmodelService);

      const eserviceVersion = assertEserviceVersionAllowsAgreementCreation(
        eservice,
        eserviceVersionId,
      );
      assertEserviceVersionIsLatest(eservice, eserviceVersionId);

      assertConsumerHasRequiredAttributes(
        consumerAttributes,
        eserviceVersion.requiredAttributes,
        consumer.id,
        eserviceId,
      );

      const allRequiredAttributes = eserviceVersion.requiredAttributes.flat();
      const matchingAttributes = consumerAttributes.filter((consumerAtt) =>
        allRequiredAttributes.some(
          (required) =>
            required.code === consumerAtt.code &&
            required.scheme === consumerAtt.scheme,
        ),
      );

      const now = new Date();
      const state = eservice.isConsumerOperatorIdentificationRequired
        ? AgreementState.enum.PendingConsumerOperatorIdentification
        : AgreementState.enum.Active;

      const agreement: Agreement = {
        attributes: matchingAttributes,
        consumer: {
          id: consumer.id,
          knodeId: consumer.knodeId,
        },
        createdAt: now,
        eserviceId,
        eserviceVersionId,
        id: agreementId,
        producerId: eservice.producerId,
        state,
        suspendedByConsumerAt: null,
        suspendedByProducerAt: null,
        updatedAt: now,
      };

      const event = eservice.isConsumerOperatorIdentificationRequired
        ? createAgreementCreatedPendingConsumerOperatorIdentificationV1Event(
            agreement,
            correlationId,
          )
        : createAgreementActivatedV1Event(agreement, correlationId);

      const { newVersion } = await eventStoreWriter.insertEvent(event);

      return { data: agreement, metadata: { version: newVersion } };
    },
    async getAgreement(
      agreementId: AgreementId,
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<WithMetadata<Agreement>> {
      logger.info(`Getting Agreement with ID ${agreementId}`);

      const agreement = await retrieveAgreement(agreementId, readmodelService);

      return agreement;
    },
    async getAgreements(
      requestQuery: API_GetAgreementsQueryParams,
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<ListResult<Agreement>> {
      logger.info({ requestQuery }, "Getting Agreements with query params");

      return await readmodelService.getAgreements(requestQuery);
    },
    async reactivateAgreement(
      agreementId: AgreementId,
      caller: CallerIdentity,
    ): Promise<WithMetadata<Agreement>> {
      const {
        actor,
        ctx: { correlationId, logger },
      } = caller;
      logger.info(`Reactivating Agreement ${agreementId} by ${actor}`);

      const { data: agreement, metadata } = await retrieveAgreement(
        agreementId,
        readmodelService,
      );

      // Consumer calls arrive via an internal k2k token from RRM; RRM is
      // responsible for the caller=consumer check on its side before
      // issuing the downstream call, so we only verify the producer here.
      if (caller.actor === AgreementActor.enum.Producer) {
        assertOrganizationIsAgreementProducer(
          agreement,
          caller.ctx.authData.organizationId,
        );
      }

      assertAgreementCanBeReactivatedBy(agreement, actor);

      const now = new Date();
      const suspendedByConsumerAt =
        actor === AgreementActor.enum.Consumer
          ? null
          : agreement.suspendedByConsumerAt;
      const suspendedByProducerAt =
        actor === AgreementActor.enum.Producer
          ? null
          : agreement.suspendedByProducerAt;
      const nextState: AgreementState =
        suspendedByConsumerAt === null && suspendedByProducerAt === null
          ? AgreementState.enum.Active
          : AgreementState.enum.Suspended;

      const updatedAgreement: Agreement = {
        ...agreement,
        state: nextState,
        suspendedByConsumerAt,
        suspendedByProducerAt,
        updatedAt: now,
      };

      const eventFactory =
        actor === AgreementActor.enum.Producer
          ? createAgreementReactivatedByProducerV1Event
          : createAgreementReactivatedByConsumerV1Event;

      const { newVersion } = await eventStoreWriter.insertEvent(
        eventFactory(updatedAgreement, metadata.version, correlationId),
      );

      return { data: updatedAgreement, metadata: { version: newVersion } };
    },
    async suspendAgreement(
      agreementId: AgreementId,
      caller: CallerIdentity,
    ): Promise<WithMetadata<Agreement>> {
      const {
        actor,
        ctx: { correlationId, logger },
      } = caller;
      logger.info(`Suspending Agreement ${agreementId} by ${actor}`);

      const { data: agreement, metadata } = await retrieveAgreement(
        agreementId,
        readmodelService,
      );

      // Producer authorization runs before the state-transition check so
      // unauthorized callers get 403 instead of leaking 409 state info.
      // Consumer calls arrive via an internal k2k token from RRM; RRM is
      // responsible for the caller=consumer check on its side before
      // issuing the downstream call, so we only verify the producer here.
      if (caller.actor === AgreementActor.enum.Producer) {
        assertOrganizationIsAgreementProducer(
          agreement,
          caller.ctx.authData.organizationId,
        );
      }

      assertAgreementCanBeSuspendedBy(agreement, actor);

      const now = new Date();
      const updatedAgreement: Agreement = {
        ...agreement,
        state: AgreementState.enum.Suspended,
        suspendedByConsumerAt:
          actor === AgreementActor.enum.Consumer
            ? now
            : agreement.suspendedByConsumerAt,
        suspendedByProducerAt:
          actor === AgreementActor.enum.Producer
            ? now
            : agreement.suspendedByProducerAt,
        updatedAt: now,
      };

      const eventFactory =
        actor === AgreementActor.enum.Producer
          ? createAgreementSuspendedByProducerV1Event
          : createAgreementSuspendedByConsumerV1Event;

      const { newVersion } = await eventStoreWriter.insertEvent(
        eventFactory(updatedAgreement, metadata.version, correlationId),
      );

      return { data: updatedAgreement, metadata: { version: newVersion } };
    },
  };
}
