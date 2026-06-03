/* eslint-disable max-lines-per-function */
import type {
  EserviceId,
  EserviceInterfaceId,
  OrganizationId,
} from "@knodia/common-models/ids";
import type {
  ListResult,
  WithMetadata,
} from "@knodia/db-readmodel-commons/models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  createOrderByFilters,
  escapeRegExp,
  getTableTotalCount,
  ilikeJsonB,
} from "@knodia/db-readmodel-commons/utils";
import {
  readmodelEservice,
  readmodelEserviceCategory,
  readmodelEserviceInterface,
  readmodelEservicePurposeFormOptions,
  readmodelEserviceVersion,
  readmodelEserviceVersionRequiredAttribute,
} from "@knodia/db-readmodel-eservice";
import {
  aggregateEservices,
  aggregateEserviceVersion,
  toEserviceVersionInterface,
} from "@knodia/db-readmodel-eservice/converters";
import { eserviceReadmodelServiceBuilder } from "@knodia/db-readmodel-eservice/services";
import { organizationReadmodelServiceBuilder } from "@knodia/db-readmodel-organization/services";
import {
  type Eservice,
  type EserviceInterface,
  EserviceVersionState,
} from "@knodia/eservice-models";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

import type {
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
  API_GetEservicesQueryParams,
} from "../models/api.ts";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  const eserviceReadmodelService = eserviceReadmodelServiceBuilder(readmodelDb);
  const organizationReadmodelService =
    organizationReadmodelServiceBuilder(readmodelDb);

  const latestVersionSubquery = (
    tx: NodePgDatabase,
    eserviceIdFilter: EserviceId | typeof readmodelEservice.id,
  ) =>
    tx
      .select({
        id: readmodelEserviceVersion.id,
        state: readmodelEserviceVersion.state,
        versionNumber: readmodelEserviceVersion.versionNumber,
      })
      .from(readmodelEserviceVersion)
      .where(eq(readmodelEserviceVersion.eserviceId, eserviceIdFilter))
      .orderBy(desc(readmodelEserviceVersion.versionNumber))
      .limit(1)
      .as("latestVersion");

  return {
    async getCatalogEservices(
      body: API_GetCatalogEserviceSearchParams,
      params: API_GetCatalogEservicesQueryParams,
    ): Promise<ListResult<Eservice>> {
      const { limit, offset } = params;

      const keywords = "keywords" in body ? body.keywords : undefined;
      const category = "category" in body ? body.category : undefined;

      return await readmodelDb.transaction(async (tx) => {
        const orderByFilters = createOrderByFilters({
          sortBy: "updatedAt",
          sortOrder: "desc",
          table: readmodelEservice,
        });

        const latestEserviceVersion = latestVersionSubquery(
          tx,
          readmodelEservice.id,
        );

        const createFilterQuery = () =>
          tx
            .select({ eserviceId: readmodelEservice.id })
            .from(readmodelEservice)
            .leftJoin(
              readmodelEserviceCategory,
              eq(readmodelEservice.id, readmodelEserviceCategory.eserviceId),
            )
            .innerJoinLateral(
              latestEserviceVersion,
              inArray(latestEserviceVersion.state, [
                EserviceVersionState.enum.Active,
                EserviceVersionState.enum.Suspended,
              ]),
            )
            .where(
              and(
                category
                  ? and(
                      eq(readmodelEserviceCategory.code, category.code),
                      eq(readmodelEserviceCategory.scheme, category.scheme),
                    )
                  : undefined,
                keywords
                  ? or(
                      ilikeJsonB({
                        column: readmodelEservice.name,
                        value: keywords,
                      }),
                      ilikeJsonB({
                        column: readmodelEservice.description,
                        value: keywords,
                      }),
                    )
                  : undefined,
              ),
            )
            .groupBy(readmodelEservice.id)
            .$dynamic();

        const paginatedIds = createFilterQuery()
          .orderBy(...orderByFilters)
          .limit(limit)
          .offset(offset)
          .as("paginatedIds");

        const [queryRes, totalCount] = await Promise.all([
          tx
            .select({
              category: readmodelEserviceCategory,
              eservice: readmodelEservice,
              interface: readmodelEserviceInterface,
              purposeFormOptions: readmodelEservicePurposeFormOptions,
              requiredAttribute: readmodelEserviceVersionRequiredAttribute,
              version: readmodelEserviceVersion,
            })
            .from(readmodelEservice)
            .innerJoin(
              paginatedIds,
              eq(readmodelEservice.id, paginatedIds.eserviceId),
            )
            .leftJoin(
              readmodelEserviceCategory,
              eq(readmodelEservice.id, readmodelEserviceCategory.eserviceId),
            )
            .leftJoin(
              readmodelEserviceVersion,
              eq(readmodelEserviceVersion.eserviceId, readmodelEservice.id),
            )
            .leftJoin(
              readmodelEserviceInterface,
              eq(
                readmodelEserviceInterface.eserviceVersionId,
                readmodelEserviceVersion.id,
              ),
            )
            .leftJoin(
              readmodelEserviceVersionRequiredAttribute,
              and(
                eq(
                  readmodelEserviceVersionRequiredAttribute.eserviceId,
                  readmodelEserviceVersion.eserviceId,
                ),
                eq(
                  readmodelEserviceVersionRequiredAttribute.eserviceVersionId,
                  readmodelEserviceVersion.id,
                ),
              ),
            )
            .leftJoin(
              readmodelEservicePurposeFormOptions,
              eq(
                readmodelEservicePurposeFormOptions.eserviceId,
                readmodelEservice.id,
              ),
            )
            .orderBy(...orderByFilters),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        const eservices = aggregateEservices(queryRes);

        return {
          results: eservices.map((e) => e.data),
          totalCount,
        };
      });
    },
    async getEservice(
      eserviceId: EserviceId,
    ): Promise<undefined | WithMetadata<Eservice>> {
      return await eserviceReadmodelService.getEserviceById(eserviceId);
    },
    async getEserviceLatestVersion(eserviceId: EserviceId) {
      return await readmodelDb.transaction(async (tx) => {
        const latestVersion = latestVersionSubquery(tx, eserviceId);

        const queryRes = await tx
          .select({
            requiredAttribute: readmodelEserviceVersionRequiredAttribute,
            version: readmodelEserviceVersion,
          })
          .from(readmodelEserviceVersion)
          .innerJoin(
            latestVersion,
            eq(readmodelEserviceVersion.id, latestVersion.id),
          )
          .leftJoin(
            readmodelEserviceVersionRequiredAttribute,
            eq(
              readmodelEserviceVersionRequiredAttribute.eserviceVersionId,
              readmodelEserviceVersion.id,
            ),
          )
          .where(eq(readmodelEserviceVersion.eserviceId, eserviceId))
          .orderBy(desc(readmodelEserviceVersion.versionNumber));

        return aggregateEserviceVersion(queryRes);
      });
    },
    async getEserviceLatestVersionInterface(
      eserviceId: EserviceId,
    ): Promise<EserviceInterface | undefined> {
      return await readmodelDb.transaction(async (tx) => {
        const latestVersion = latestVersionSubquery(tx, eserviceId);

        const queryRes = await tx
          .select()
          .from(readmodelEserviceInterface)
          .innerJoin(
            latestVersion,
            eq(readmodelEserviceInterface.eserviceVersionId, latestVersion.id),
          )
          .where(eq(readmodelEserviceInterface.eserviceId, eserviceId))
          .limit(1);

        const row = queryRes.at(0);
        return row
          ? toEserviceVersionInterface(row.eservice_interface)
          : undefined;
      });
    },
    async getEservices(
      params: API_GetEservicesQueryParams,
    ): Promise<ListResult<Eservice>> {
      const {
        eserviceId,
        limit,
        mode,
        offset,
        producerId,
        q,
        sortBy,
        sortOrder,
        state,
      } = params;

      return await readmodelDb.transaction(async (tx) => {
        const orderByFilters = createOrderByFilters({
          sortBy,
          sortOrder,
          table: readmodelEservice,
        });

        const latestEserviceVersion = latestVersionSubquery(
          tx,
          readmodelEservice.id,
        );

        const createFilterQuery = () =>
          tx
            .select({ eserviceId: readmodelEservice.id })
            .from(readmodelEservice)
            .leftJoin(
              readmodelEserviceCategory,
              eq(readmodelEservice.id, readmodelEserviceCategory.eserviceId),
            )
            .innerJoinLateral(latestEserviceVersion, sql`true`)
            .where(
              and(
                producerId
                  ? eq(readmodelEservice.producerId, producerId)
                  : undefined,
                eserviceId && eserviceId.length > 0
                  ? inArray(readmodelEservice.id, eserviceId)
                  : undefined,
                mode ? eq(readmodelEservice.mode, mode) : undefined,
                state && state.length > 0
                  ? inArray(latestEserviceVersion.state, state)
                  : undefined,
                q
                  ? or(
                      ilikeJsonB({ column: readmodelEservice.name, value: q }),
                      ilikeJsonB({
                        column: readmodelEservice.description,
                        value: q,
                      }),
                      ilike(
                        // TODO: filter by category name instead of code when using real data
                        readmodelEserviceCategory.code,
                        `%${escapeRegExp(q)}%`,
                      ),
                    )
                  : undefined,
              ),
            )
            .groupBy(readmodelEservice.id)
            .$dynamic();

        const paginatedIds = createFilterQuery()
          .orderBy(...orderByFilters)
          .limit(limit)
          .offset(offset)
          .as("paginatedIds");

        const [queryRes, totalCount] = await Promise.all([
          tx
            .select({
              category: readmodelEserviceCategory,
              eservice: readmodelEservice,
              interface: readmodelEserviceInterface,
              purposeFormOptions: readmodelEservicePurposeFormOptions,
              requiredAttribute: readmodelEserviceVersionRequiredAttribute,
              version: readmodelEserviceVersion,
            })
            .from(readmodelEservice)
            .innerJoin(
              paginatedIds,
              eq(readmodelEservice.id, paginatedIds.eserviceId),
            )
            .leftJoin(
              readmodelEserviceCategory,
              eq(readmodelEservice.id, readmodelEserviceCategory.eserviceId),
            )
            .leftJoin(
              readmodelEserviceVersion,
              eq(readmodelEserviceVersion.eserviceId, readmodelEservice.id),
            )
            .leftJoin(
              readmodelEserviceInterface,
              eq(
                readmodelEserviceInterface.eserviceVersionId,
                readmodelEserviceVersion.id,
              ),
            )
            .leftJoin(
              readmodelEserviceVersionRequiredAttribute,
              and(
                eq(
                  readmodelEserviceVersionRequiredAttribute.eserviceId,
                  readmodelEserviceVersion.eserviceId,
                ),
                eq(
                  readmodelEserviceVersionRequiredAttribute.eserviceVersionId,
                  readmodelEserviceVersion.id,
                ),
              ),
            )
            .leftJoin(
              readmodelEservicePurposeFormOptions,
              eq(
                readmodelEservicePurposeFormOptions.eserviceId,
                readmodelEservice.id,
              ),
            )
            .orderBy(...orderByFilters),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        const eservices = aggregateEservices(queryRes);

        return {
          results: eservices.map((e) => e.data),
          totalCount,
        };
      });
    },
    async getEserviceVersionInterfaceById(
      interfaceId: EserviceInterfaceId,
    ): Promise<EserviceInterface | undefined> {
      return await eserviceReadmodelService.getEserviceVersionInterfaceById(
        interfaceId,
      );
    },
    async getOrganizationById(organizationId: OrganizationId) {
      return await organizationReadmodelService.getOrganizationById(
        organizationId,
      );
    },
  };
}
