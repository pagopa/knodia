import type { EserviceEventStoreWriter } from "@knodia/db-event-store-writer/eservice";
import type {
  ListResult,
  WithMetadata,
} from "@knodia/db-readmodel-commons/models";
import type {
  InternalAuthData,
  UISessionAuthData,
} from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import { getAttribute } from "@knodia/attribute-models";
import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import {
  type EserviceId,
  type EserviceVersionId,
  generateId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import {
  type Eservice,
  type EserviceInterface,
  type EserviceVersion,
  EserviceVersionState,
} from "@knodia/eservice-models";
import { getEserviceTemplate } from "@knodia/eservice-template-models";

import type {
  API_EservicePatch,
  API_EserviceSeed,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
  API_GetEservicesQueryParams,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  duplicateInterfaceId,
  eserviceTemplateNotFound,
  inconsistentDailyCalls,
  invalidAttribute,
} from "../models/errors.ts";
import {
  createEserviceUpdatedV1Event,
  createEserviceVersionActivatedV1Event,
  createEserviceVersionArchivedV1Event,
  createEserviceVersionReactivatedV1Event,
  createEserviceVersionSuspendedV1Event,
} from "../models/eserviceEventFactory.ts";
import {
  retrieveEservice,
  retrieveEserviceLatestVersion,
  retrieveEserviceLatestVersionInterface,
} from "../utils/readmodelUtils.ts";
import {
  findEserviceLatestVersion,
  updateEserviceVersionState,
} from "../utils/utils.ts";
import {
  assertEserviceVersionIsActive,
  assertEserviceVersionIsSuspended,
  assertIsEserviceProducer,
  assertOrganizationExists,
  assertValidCategories,
} from "../utils/validators.ts";

export type EserviceService = ReturnType<typeof eserviceServiceBuilder>;

// eslint-disable-next-line max-lines-per-function
export function eserviceServiceBuilder(
  eventStoreWriter: EserviceEventStoreWriter,
  readmodelService: ReadmodelService,
  config: { isConsumerOperatorIdentificationRequired: boolean },
) {
  return {
    async archiveEservice(
      eserviceId: EserviceId,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<Eservice>> {
      logger.info(`Archiving E-service ${eserviceId}`);

      const {
        data: eservice,
        metadata: { version },
      } = await retrieveEservice(eserviceId, readmodelService);

      assertIsEserviceProducer(eservice, authData.organizationId);

      const latestVersion = findEserviceLatestVersion(eservice);
      assertEserviceVersionIsSuspended(eservice, latestVersion);

      const updatedEservice = updateEserviceVersionState(
        eservice,
        latestVersion.id,
        EserviceVersionState.enum.Archived,
        new Date(),
      );

      const { newVersion } = await eventStoreWriter.insertEvent(
        createEserviceVersionArchivedV1Event(
          updatedEservice,
          latestVersion.id,
          correlationId,
          version,
        ),
      );

      return { data: updatedEservice, metadata: { version: newVersion } };
    },
    async createEservice(
      seed: API_EserviceSeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<Eservice>> {
      const eserviceId = generateId<EserviceId>();
      const { organizationId: producerId } = authData;

      logger.info(
        `Creating E-service ${eserviceId} for producer ${producerId}`,
      );

      await assertOrganizationExists(producerId, readmodelService);

      const { categories, mode, requiredAttributes, template } =
        resolveTemplateFixedFields(seed);

      for (const attr of requiredAttributes.flat()) {
        if (getAttribute(attr) === undefined) {
          throw invalidAttribute(attr.scheme, attr.code);
        }
      }

      assertValidCategories(categories);

      const existingInterface =
        await readmodelService.getEserviceVersionInterfaceById(
          seed.interfaceDocument.id,
        );

      if (existingInterface) {
        throw duplicateInterfaceId(seed.interfaceDocument.id);
      }

      if (seed.maxDailyCallsPerConsumer > seed.maxDailyCallsPerKnode) {
        throw inconsistentDailyCalls();
      }

      const now = new Date();
      const eserviceVersionId = generateId<EserviceVersionId>();

      const eservice: Eservice = {
        categories: categories ?? [],
        createdAt: now,
        description: seed.description,
        id: eserviceId,
        isConsumerOperatorIdentificationRequired:
          config.isConsumerOperatorIdentificationRequired,
        isSignalHubEnabled: seed.isSignalHubEnabled ?? false,
        mode: mode ?? "ProvideData",
        name: seed.name,
        producerId,
        template,
        updatedAt: now,
        versions: [
          {
            accessTokenAudience: seed.accessTokenAudience,
            accessTokenDuration: seed.accessTokenDuration ?? 3600,
            accessTokenType: seed.accessTokenType ?? "Bearer",
            createdAt: now,
            id: eserviceVersionId,
            interfaceDocument: {
              checksum: seed.interfaceDocument.checksum,
              contentType: seed.interfaceDocument.contentType,
              createdAt: now,
              id: seed.interfaceDocument.id,
              name: seed.interfaceDocument.name,
              path: seed.interfaceDocument.path,
              prettyName: seed.interfaceDocument.prettyName,
              updatedAt: now,
            },
            maxDailyCallsPerConsumer: seed.maxDailyCallsPerConsumer,
            maxDailyCallsPerKnode: seed.maxDailyCallsPerKnode,
            requiredAttributes,
            state: "Active",
            updatedAt: now,
            versionNumber: 1,
          },
        ],
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createEserviceVersionActivatedV1Event(
          eservice,
          eserviceVersionId,
          correlationId,
        ),
      );

      return { data: eservice, metadata: { version: newVersion } };
    },

    async getCatalogEservices(
      body: API_GetCatalogEserviceSearchParams,
      params: API_GetCatalogEservicesQueryParams,
      { logger }: AuthorizedContext<InternalAuthData>,
    ): Promise<ListResult<Eservice>> {
      logger.info({ body, params }, "Getting catalog E-services with params");
      return await readmodelService.getCatalogEservices(body, params);
    },
    async getEservice(
      eserviceId: EserviceId,
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<WithMetadata<Eservice>> {
      logger.info(`Getting E-service with ID ${eserviceId}`);

      return await retrieveEservice(eserviceId, readmodelService);
    },
    async getEserviceLatestVersion(
      eserviceId: EserviceId,
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<Omit<EserviceVersion, "interfaceDocument">> {
      logger.info(`Getting latest version of E-service with ID ${eserviceId}`);

      return await retrieveEserviceLatestVersion(eserviceId, readmodelService);
    },
    async getEserviceLatestVersionInterface(
      eserviceId: EserviceId,
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<EserviceInterface> {
      logger.info(
        `Getting latest version interface of E-service with ID ${eserviceId}`,
      );

      return await retrieveEserviceLatestVersionInterface(
        eserviceId,
        readmodelService,
      );
    },

    async getEservices(
      params: API_GetEservicesQueryParams,
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<ListResult<Eservice>> {
      logger.info({ params }, "Getting E-services with params");

      return await readmodelService.getEservices(params);
    },

    async reactivateEservice(
      eserviceId: EserviceId,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<Eservice>> {
      logger.info(`Reactivating E-service ${eserviceId}`);

      const {
        data: eservice,
        metadata: { version },
      } = await retrieveEservice(eserviceId, readmodelService);

      assertIsEserviceProducer(eservice, authData.organizationId);

      const latestVersion = findEserviceLatestVersion(eservice);
      assertEserviceVersionIsSuspended(eservice, latestVersion);

      const updatedEservice = updateEserviceVersionState(
        eservice,
        latestVersion.id,
        EserviceVersionState.enum.Active,
        new Date(),
      );

      const { newVersion } = await eventStoreWriter.insertEvent(
        createEserviceVersionReactivatedV1Event(
          updatedEservice,
          latestVersion.id,
          correlationId,
          version,
        ),
      );

      return { data: updatedEservice, metadata: { version: newVersion } };
    },

    async suspendEservice(
      eserviceId: EserviceId,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<Eservice>> {
      logger.info(`Suspending E-service ${eserviceId}`);

      const {
        data: eservice,
        metadata: { version },
      } = await retrieveEservice(eserviceId, readmodelService);

      assertIsEserviceProducer(eservice, authData.organizationId);

      const latestVersion = findEserviceLatestVersion(eservice);
      assertEserviceVersionIsActive(eservice, latestVersion);

      const updatedEservice = updateEserviceVersionState(
        eservice,
        latestVersion.id,
        EserviceVersionState.enum.Suspended,
        new Date(),
      );

      const { newVersion } = await eventStoreWriter.insertEvent(
        createEserviceVersionSuspendedV1Event(
          updatedEservice,
          latestVersion.id,
          correlationId,
          version,
        ),
      );

      return { data: updatedEservice, metadata: { version: newVersion } };
    },

    async updateEservice(
      eserviceId: EserviceId,
      update: API_EservicePatch,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<Eservice>> {
      logger.info(`Updating E-service ${eserviceId}`);

      const {
        data: eservice,
        metadata: { version },
      } = await retrieveEservice(eserviceId, readmodelService);

      assertIsEserviceProducer(eservice, authData.organizationId);

      assertValidCategories(update.categories);

      const now = new Date();

      const updatedEservice: Eservice = {
        ...eservice,
        categories: update.categories ?? eservice.categories,
        description: update.description ?? eservice.description,
        name: update.name ?? eservice.name,
        updatedAt: now,
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createEserviceUpdatedV1Event(updatedEservice, correlationId, version),
      );

      return { data: updatedEservice, metadata: { version: newVersion } };
    },
  };
}

function resolveTemplateFixedFields(
  seed: API_EserviceSeed,
): Pick<Eservice, "categories" | "mode" | "template"> &
  Pick<EserviceVersion, "requiredAttributes"> {
  if ("template" in seed) {
    const template = getEserviceTemplate(
      unsafeBrandId(seed.template.id),
      seed.template.knodeId,
    );

    if (!template) {
      throw eserviceTemplateNotFound(
        unsafeBrandId(seed.template.id),
        seed.template.knodeId,
      );
    }

    return {
      categories: template.eserviceFields.categories,
      mode: template.eserviceFields.mode,
      requiredAttributes: template.eserviceFields.requiredAttributes,
      template: {
        id: unsafeBrandExternalId(seed.template.id),
        knodeId: seed.template.knodeId,
      },
    };
  }

  return {
    categories: seed.categories ?? [],
    mode: seed.mode ?? "ProvideData",
    requiredAttributes: seed.requiredAttributes,
    template: undefined,
  };
}
