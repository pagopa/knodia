import type {
  EserviceId,
  EserviceInterfaceId,
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
          interface: readmodelEserviceInterface,
          requiredAttribute: readmodelEserviceVersionRequiredAttribute,
          version: readmodelEserviceVersion,
        })
        .from(readmodelEservice)
        .leftJoin(
          readmodelEserviceCategory,
          eq(readmodelEserviceCategory.eserviceId, readmodelEservice.id),
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
        .where(eq(readmodelEservice.id, eserviceId));

      return aggregateEservice(queryRes);
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
