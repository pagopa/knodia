import type {
  EserviceId,
  EserviceInterfaceId,
  EserviceVersionId,
} from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { Eservice, EserviceInterface } from "@knodia/eservice-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { and, eq } from "drizzle-orm";

import { aggregateEservice } from "../converters/aggregators.ts";
import { toEserviceVersionInterface } from "../converters/index.ts";
import {
  readmodelEservice,
  readmodelEserviceCategory,
  readmodelEserviceInterface,
} from "../eservice.ts";

export function eserviceReadmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  return {
    async getEServiceById(
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
    async getEserviceVersionInterface(
      eserviceId: EserviceId,
      eserviceVersionId: EserviceVersionId,
    ): Promise<EserviceInterface | undefined> {
      const queryRes = await readmodelDb
        .select()
        .from(readmodelEserviceInterface)
        .where(
          and(
            eq(readmodelEserviceInterface.eserviceId, eserviceId),
            eq(readmodelEserviceInterface.eserviceVersionId, eserviceVersionId),
          ),
        )
        .limit(1);

      const versionInterface = queryRes.at(0);

      return versionInterface
        ? toEserviceVersionInterface(versionInterface)
        : undefined;
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
