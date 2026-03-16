import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  KnodeId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";
import type { PurposeEventStoreWriter } from "@knodia/db-event-store-writer/purpose";
import type {
  InternalAuthData,
  UISessionAuthData,
} from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { Purpose } from "@knodia/purpose-models";

import { EserviceId, generateId } from "@knodia/common-models/ids";

import type { ReadmodelService } from "./readmodelService.ts";

import { createPurposeActivatedV1Event } from "../models/purposeEventFactory.ts";
import { retrieveEservice, retrievePurpose } from "../utils/readmodelUtils.ts";
import {
  assertActiveAgreementExists,
  assertEserviceIsActive,
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
        formAnswers,
        name,
      }: {
        consumer: {
          id: ExternalId<OrganizationId>;
          knodeId: KnodeId;
        };
        dailyCalls: number;
        description: { en: string };
        eserviceId: EserviceId;
        formAnswers: Record<string, unknown>;
        name: { en: string };
      },
      { correlationId, logger }: AuthorizedContext<InternalAuthData>,
    ): Promise<Purpose> {
      const purposeId = generateId<PurposeId>();
      logger.info(
        { requestBody: { consumer, eserviceId, name } },
        `Creating Purpose ${purposeId}`,
      );

      await retrieveEservice(eserviceId, readmodelService);
      await assertEserviceIsActive(eserviceId, readmodelService);

      await assertActiveAgreementExists({
        consumerId: consumer.id,
        consumerKnodeId: consumer.knodeId,
        eserviceId,
        readmodelService,
      });

      const now = new Date();
      const purpose: Purpose = {
        consumer,
        createdAt: now,
        dailyCalls,
        description,
        eserviceId,
        formAnswers,
        id: purposeId,
        name,
        state: "Active",
        updatedAt: now,
      };

      await eventStoreWriter.insertEvent(
        createPurposeActivatedV1Event(purpose, correlationId),
      );

      return purpose;
    },
    async getPurpose(
      purposeId: PurposeId,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<Purpose> {
      logger.info(`Getting Purpose with ID ${purposeId}`);

      return await retrievePurpose(purposeId, readmodelService);
    },
  };
}
