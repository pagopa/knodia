import type { OrganizationId } from "@knodia/common-models/ids";
import type {
  API_ProducerEserviceListItem,
  API_ProducerEservicesQueryParams,
} from "@knodia/eservice-models/api";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  createOrderByFilters,
  getTableTotalCount,
  ilikeJsonB,
  type ListResult,
} from "@knodia/db-readmodel-commons";
import {
  readmodelEservice,
  readmodelEserviceCategory,
  readmodelEserviceInterface,
  readmodelEserviceVersion,
  readmodelEserviceVersionRequiredAttribute,
} from "@knodia/db-readmodel-eservice";
import {
  aggregateEservices,
  toEservicesAggregator,
} from "@knodia/db-readmodel-eservice/converters";
import { deriveEserviceStatus } from "@knodia/eservice-models";
import { and, eq } from "drizzle-orm";

import { toEserviceVersionState } from "../models/apiConverter.ts";

export type ReadModelService = ReturnType<typeof readModelServiceBuilder>;

export function readModelServiceBuilder(readModelDb: NodePgDatabase) {
  return {
    async getProducerEservices(
      params: API_ProducerEservicesQueryParams,
      producerId: OrganizationId,
    ): Promise<ListResult<API_ProducerEserviceListItem>> {
      const { limit, mode, offset, q, sortBy, sortOrder, status } = params;

      return await readModelDb.transaction(async (tx) => {
        const orderByFilters = createOrderByFilters({
          sortBy,
          sortOrder,
          table: readmodelEservice,
        });
        const queryRes = await tx
          .select({
            category: readmodelEserviceCategory,
            eservice: readmodelEservice,
            interface: readmodelEserviceInterface,
            requiredAttribute: readmodelEserviceVersionRequiredAttribute,
            version: readmodelEserviceVersion,
          })
          .from(readmodelEservice)
          .innerJoin(
            readmodelEserviceVersion,
            eq(readmodelEservice.id, readmodelEserviceVersion.eserviceId),
          )
          .where(
            and(
              eq(readmodelEservice.producerId, producerId),
              mode ? eq(readmodelEservice.mode, mode) : undefined,
              status
                ? eq(
                    readmodelEserviceVersion.state,
                    toEserviceVersionState(status),
                  )
                : undefined,
              q ? ilikeJsonB(readmodelEservice.name, q) : undefined,
            ),
          )
          .limit(limit)
          .offset(offset)
          .orderBy(...orderByFilters);

        const eservices = aggregateEservices(toEservicesAggregator(queryRes));


        const [
          totalCount,
        ] = await Promise.all([
          getTableTotalCount(tx, readmodelEservice),
        ]);

        const results = eservices.map((e) => ({
          ...e.data,
          // TODO: add real data
          activeAgreements: 0,
          activePurposes: 0,
          status: deriveEserviceStatus(e.data),
        }));

        return { results, totalCount };
      });
    },
  };
}
