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
        name,
      }: {
        consumer: {
          id: ExternalId<OrganizationId>;
          knodeId: KnodeId;
        };
        dailyCalls: number;
        description: { en: string };
        eserviceId: EserviceId;
        formAnswersJson: Record<string, unknown>;
        name: { en: string };
      },
      { correlationId, logger }: AuthorizedContext<InternalAuthData>,
    ): Promise<Purpose> {
      const purposeId = generateId<PurposeId>();
      logger.info(
        { requestBody: { consumer, eserviceId, name } },
        `Creating Purpose ${purposeId}`,
      );

      const eservice = await retrieveEservice(eserviceId, readmodelService);
      assertEserviceModeIs(eservice, "ProvideData");
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

      // TODO form ansewers validation against the Knode purpose form JSON schema

      const now = new Date();
      const purpose: Purpose = {
        consumer,
        createdAt: now,
        dailyCalls,
        description,
        eserviceId,
        formAnswersJson,
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
