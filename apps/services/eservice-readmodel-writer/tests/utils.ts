import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  readmodelEservice,
  readmodelEserviceCategory,
  readmodelEserviceInterface,
  readmodelEservicePurposeFormOption,
  readmodelEserviceVersion,
  readmodelEserviceVersionRequiredAttribute,
} from "@knodia/db-readmodel-eservice";
import { aggregateEservices } from "@knodia/db-readmodel-eservice/converters";
import { eq } from "drizzle-orm";

export async function getAllEservices(readmodelDb: NodePgDatabase) {
  const queryRes = await readmodelDb
    .select({
      category: readmodelEserviceCategory,
      eservice: readmodelEservice,
      interface: readmodelEserviceInterface,
      purposeFormOptions: readmodelEservicePurposeFormOption,
      requiredAttribute: readmodelEserviceVersionRequiredAttribute,
      version: readmodelEserviceVersion,
    })
    .from(readmodelEservice)
    .leftJoin(
      readmodelEserviceCategory,
      eq(readmodelEservice.id, readmodelEserviceCategory.eserviceId),
    )
    .leftJoin(
      readmodelEserviceVersion,
      eq(readmodelEservice.id, readmodelEserviceVersion.eserviceId),
    )
    .leftJoin(
      readmodelEserviceInterface,
      eq(
        readmodelEserviceVersion.id,
        readmodelEserviceInterface.eserviceVersionId,
      ),
    )
    .leftJoin(
      readmodelEserviceVersionRequiredAttribute,
      eq(
        readmodelEserviceVersion.id,
        readmodelEserviceVersionRequiredAttribute.eserviceVersionId,
      ),
    )
    .leftJoin(
      readmodelEservicePurposeFormOption,
      eq(readmodelEservice.id, readmodelEservicePurposeFormOption.eserviceId),
    );

  return aggregateEservices(queryRes);
}
