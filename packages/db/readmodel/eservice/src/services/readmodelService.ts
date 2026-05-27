import type {
  EserviceId,
  EserviceInterfaceId,
  EserviceVersionId,
} from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type {
  Eservice,
  EserviceInterface,
  EserviceVersion,
} from "@knodia/eservice-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { assertSQLFiltersAreDefined } from "@knodia/db-readmodel-commons/utils";
import { and, eq, type SQL } from "drizzle-orm";

import {
  aggregateEservice,
  aggregateEserviceVersion,
} from "../converters/aggregators.ts";
import { toEserviceVersionInterface } from "../converters/index.ts";
import {
  readmodelEservice,
  readmodelEserviceCategory,
  readmodelEserviceInterface,
  readmodelEservicePurposeFormAnswer,
  readmodelEserviceVersion,
  readmodelEserviceVersionRequiredAttribute,
} from "../eservice.ts";

export function eserviceReadmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  return {
    async getEserviceByFilter(
      filters: SQL | undefined,
    ): Promise<undefined | WithMetadata<Eservice>> {
      assertSQLFiltersAreDefined(filters);

      const queryRes = await readmodelDb
        .select({
          category: readmodelEserviceCategory,
          eservice: readmodelEservice,
          interface: readmodelEserviceInterface,
          purposeFormAnswer: readmodelEservicePurposeFormAnswer,
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
        .leftJoin(
          readmodelEservicePurposeFormAnswer,
          eq(
            readmodelEservicePurposeFormAnswer.eserviceId,
            readmodelEservice.id,
          ),
        )
        .where(filters);

      return aggregateEservice(queryRes);
    },
    async getEserviceById(
      eserviceId: EserviceId,
    ): Promise<undefined | WithMetadata<Eservice>> {
      return this.getEserviceByFilter(eq(readmodelEservice.id, eserviceId));
    },
    async getEserviceVersionById(
      eserviceId: EserviceId,
      eserviceVersionId: EserviceVersionId,
    ): Promise<Omit<EserviceVersion, "interfaceDocument"> | undefined> {
      const queryRes = await readmodelDb
        .select({
          requiredAttribute: readmodelEserviceVersionRequiredAttribute,
          version: readmodelEserviceVersion,
        })
        .from(readmodelEserviceVersion)
        .leftJoin(
          readmodelEserviceVersionRequiredAttribute,
          eq(
            readmodelEserviceVersionRequiredAttribute.eserviceVersionId,
            readmodelEserviceVersion.id,
          ),
        )
        .where(
          and(
            eq(readmodelEserviceVersion.eserviceId, eserviceId),
            eq(readmodelEserviceVersion.id, eserviceVersionId),
          ),
        );

      return aggregateEserviceVersion(queryRes);
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
