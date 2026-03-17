import type {
  EserviceId,
  EserviceInterfaceId,
} from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { Eservice, EserviceInterface } from "@knodia/eservice-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { EserviceVersionState } from "@knodia/eservice-models";
import { and, desc, eq, inArray } from "drizzle-orm";

import {
  aggregateEservice,
  aggregateEserviceVersion,
} from "../converters/aggregators.ts";
import { toEserviceVersionInterface } from "../converters/index.ts";
import {
  readmodelEservice,
  readmodelEserviceCategory,
  readmodelEserviceInterface,
  readmodelEserviceVersion,
  readmodelEserviceVersionRequiredAttribute,
} from "../eservice.ts";

export function eserviceReadmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  return {
    async getEserviceById(
      eserviceId: EserviceId,
    ): Promise<undefined | WithMetadata<Eservice>> {
      const queryRes = await readmodelDb
        .select({
          category: readmodelEserviceCategory,
          eservice: readmodelEservice,
        })
        .from(readmodelEservice)
        .leftJoin(
          readmodelEserviceCategory,
          eq(readmodelEserviceCategory.eserviceId, readmodelEservice.id),
        )
        .where(eq(readmodelEservice.id, eserviceId));

      return aggregateEservice(queryRes);
    },
    async getEserviceLatestVersion(
      eserviceId: EserviceId,
      states?: EserviceVersionState[],
    ) {
      return await readmodelDb.transaction(async (tx) => {
        const latestEserviceVersion = latestEserviceVersionSubquery(
          tx,
          eserviceId,
          states,
        );

        const queryRes = await tx
          .select({
            requiredAttribute: readmodelEserviceVersionRequiredAttribute,
            version: readmodelEserviceVersion,
          })
          .from(readmodelEserviceVersion)
          .innerJoin(
            latestEserviceVersion,
            eq(readmodelEserviceVersion.id, latestEserviceVersion.id),
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
    async getEserviceVersionInterfaceById(
      interfaceId: EserviceInterfaceId,
    ): Promise<EserviceInterface | undefined> {
      const queryRes = await readmodelDb
        .select()
        .from(readmodelEserviceInterface)
        .where(eq(readmodelEserviceInterface.id, interfaceId))
        .limit(1);

      const versionInterface = queryRes.at(0);

      return versionInterface
        ? toEserviceVersionInterface(versionInterface)
        : undefined;
    },
  };
}

export const latestEserviceVersionSubquery = (
  tx: NodePgDatabase,
  eserviceIdFilter: EserviceId | typeof readmodelEservice.id,
  statesFilter?: EserviceVersionState[],
) =>
  tx
    .select({
      id: readmodelEserviceVersion.id,
      state: readmodelEserviceVersion.state,
      versionNumber: readmodelEserviceVersion.versionNumber,
    })
    .from(readmodelEserviceVersion)
    .where(
      and(
        eq(readmodelEserviceVersion.eserviceId, eserviceIdFilter),
        statesFilter && statesFilter.length > 0
          ? inArray(readmodelEserviceVersion.state, statesFilter)
          : undefined,
      ),
    )
    .orderBy(desc(readmodelEserviceVersion.versionNumber))
    .limit(1)
    .as("latestEserviceVersion");
