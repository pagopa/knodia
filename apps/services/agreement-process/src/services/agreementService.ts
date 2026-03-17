import type { Agreement } from "@knodia/agreement-models";
import type { ExternalId } from "@knodia/common-models/externalResource";
import type { AgreementEventStoreWriter } from "@knodia/db-event-store-writer/agreement";
import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type {
  InternalAuthData,
  UISessionAuthData,
} from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import {
  AgreementId,
  EserviceId,
  EserviceVersionId,
  generateId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";

import type { API_GetAgreementsQueryParams } from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import { createAgreementActivatedV1Event } from "../models/agreementEventFactory.ts";
import {
  retrieveAgreement,
  retrieveEservice,
} from "../utils/readmodelUtils.ts";
import {
  assertAgreementCanBeActivated,
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
        eserviceId,
        eserviceVersionId,
      }: {
        consumer: {
          id: ExternalId<OrganizationId>;
          knodeId: KnodeId;
        };
        eserviceId: EserviceId;
        eserviceVersionId: EserviceVersionId;
      },
      { correlationId, logger }: AuthorizedContext<InternalAuthData>,
    ): Promise<Agreement> {
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
      await assertAgreementCanBeActivated(
        eservice,
        eserviceVersionId,
        readmodelService,
      );

      // TODO: validate attributes

      const now = new Date();
      const agreement: Agreement = {
        attributes: [],
        consumer: {
          id: consumer.id,
          knodeId: consumer.knodeId,
        },
        createdAt: now,
        eserviceId,
        eserviceVersionId,
        id: agreementId,
        producerId: eservice.producerId,
        state: "Active",
        updatedAt: now,
      };

      await eventStoreWriter.insertEvent(
        createAgreementActivatedV1Event(agreement, correlationId),
      );

      return agreement;
    },
    async getAgreement(
      agreementId: AgreementId,
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<Agreement> {
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
  };
}
