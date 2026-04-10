import type { AttributeId } from "@knodia/attribute-models";
import type { ExternalResource } from "@knodia/common-models/externalResource";
import type { AgreementEventStoreWriter } from "@knodia/db-event-store-writer/agreement";
import type {
  ListResult,
  WithMetadata,
} from "@knodia/db-readmodel-commons/models";
import type {
  InternalAuthData,
  UISessionAuthData,
} from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import { type Agreement, AgreementState } from "@knodia/agreement-models";
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
  assertConsumerHasRequiredAttributes,
  assertEserviceVersionAllowsAgreementCreation,
  assertEserviceVersionIsLatest,
  assertNoConflictingAgreementsExist,
} from "../utils/validators.ts";

export type AgreementService = ReturnType<typeof agreementServiceBuilder>;

export function agreementServiceBuilder(
  eventStoreWriter: AgreementEventStoreWriter,
  readmodelService: ReadmodelService,
) {
  return {
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
      {
        agreementId,
        reactivatedBy,
      }: {
        agreementId: AgreementId;
        reactivatedBy: "consumer" | "producer";
      },
      { correlationId, logger }: AuthorizedContext<InternalAuthData>,
    ): Promise<WithMetadata<Agreement>> {
      logger.info(`Reactivating Agreement ${agreementId} by ${reactivatedBy}`);

      const { data: agreement, metadata } = await retrieveAgreement(
        agreementId,
        readmodelService,
      );

      assertAgreementCanBeReactivatedBy(agreement, reactivatedBy);

      const now = new Date();
      const suspendedByConsumerAt =
        reactivatedBy === "consumer" ? null : agreement.suspendedByConsumerAt;
      const suspendedByProducerAt =
        reactivatedBy === "producer" ? null : agreement.suspendedByProducerAt;
      const nextState: Agreement["state"] =
        suspendedByConsumerAt === null && suspendedByProducerAt === null
          ? "Active"
          : "Suspended";

      const updatedAgreement: Agreement = {
        ...agreement,
        state: nextState,
        suspendedByConsumerAt,
        suspendedByProducerAt,
        updatedAt: now,
      };

      const eventFactory =
        reactivatedBy === "producer"
          ? createAgreementReactivatedByProducerV1Event
          : createAgreementReactivatedByConsumerV1Event;

      const { newVersion } = await eventStoreWriter.insertEvent(
        eventFactory(updatedAgreement, metadata.version, correlationId),
      );

      return { data: updatedAgreement, metadata: { version: newVersion } };
    },
    async suspendAgreement(
      {
        agreementId,
        suspendedBy,
      }: {
        agreementId: AgreementId;
        suspendedBy: "consumer" | "producer";
      },
      { correlationId, logger }: AuthorizedContext<InternalAuthData>,
    ): Promise<WithMetadata<Agreement>> {
      logger.info(`Suspending Agreement ${agreementId} by ${suspendedBy}`);

      const { data: agreement, metadata } = await retrieveAgreement(
        agreementId,
        readmodelService,
      );

      assertAgreementCanBeSuspendedBy(agreement, suspendedBy);

      const now = new Date();
      const updatedAgreement: Agreement = {
        ...agreement,
        state: "Suspended",
        suspendedByConsumerAt:
          suspendedBy === "consumer" ? now : agreement.suspendedByConsumerAt,
        suspendedByProducerAt:
          suspendedBy === "producer" ? now : agreement.suspendedByProducerAt,
        updatedAt: now,
      };

      const eventFactory =
        suspendedBy === "producer"
          ? createAgreementSuspendedByProducerV1Event
          : createAgreementSuspendedByConsumerV1Event;

      const { newVersion } = await eventStoreWriter.insertEvent(
        eventFactory(updatedAgreement, metadata.version, correlationId),
      );

      return { data: updatedAgreement, metadata: { version: newVersion } };
    },
  };
}
