import type { Agreement } from "@knodia/agreement-models";
import type { AgreementEventStoreWriter } from "@knodia/db-event-store-writer/agreement";
import type { AuthData } from "@knodia/fastify-zod-api-commons/auth";

import { type RequestContextData } from "@fastify/request-context";
import {
  AgreementId,
  EserviceId,
  EserviceVersionId,
  generateId,
  KnodeId,
  OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";

import type { API_AgreementSeed } from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import { createAgreementActivatedV1Event } from "../models/agreementEventFactory.ts";
import { retrieveEservice } from "../utils/readmodelUtils.ts";
import { validateCreationOnEserviceVersion } from "../utils/validators.ts";

export type AgreementService = ReturnType<typeof agreementServiceBuilder>;

export function agreementServiceBuilder(
  eventStoreWriter: AgreementEventStoreWriter,
  readmodelService: ReadmodelService,
) {
  return {
    async createAgreement(
      seed: API_AgreementSeed,
      { authData, correlationId, logger }: RequestContextData,
    ): Promise<Agreement> {
      const {
        consumerId: seedConsumerId,
        consumerKnodeId,
        eserviceId: seedEserviceId,
        eserviceVersionId: seedEserviceVersionId,
      } = seed;
      const consumerId = unsafeBrandId<OrganizationId>(seedConsumerId);
      const eserviceId = unsafeBrandId<EserviceId>(seedEserviceId);
      const eserviceVersionId = unsafeBrandId<EserviceVersionId>(
        seedEserviceVersionId,
      );

      const agreementId = generateId<AgreementId>();
      logger.info({ requestBody: seed }, `Creating Agreement ${agreementId}`);

      // TODO: move in a shared place and create error
      function assertAuthDataExists(
        authData: AuthData | undefined,
      ): asserts authData is AuthData {
        if (!authData) {
          throw new Error("Auth data is required to create an agreement");
        }
      }
      assertAuthDataExists(authData);
      const eservice = await retrieveEservice(eserviceId, readmodelService);
      await validateCreationOnEserviceVersion(
        eservice,
        eserviceVersionId,
        readmodelService,
      );

      // TODO: validate attributes

      const now = new Date();
      const agreement: Agreement = {
        attributes: [],
        consumer: {
          id: consumerId,
          knodeId: KnodeId.parse(consumerKnodeId),
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
  };
}
