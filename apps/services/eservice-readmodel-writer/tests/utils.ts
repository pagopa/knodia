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
import { eq } from "drizzle-orm";

import { readModelDb } from "./setup.ts";

// TODO: move to a shared location for tests
export async function getAllEservices() {
  const queryRes = await readModelDb
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
    );

  return aggregateEservices(toEservicesAggregator(queryRes));
}
