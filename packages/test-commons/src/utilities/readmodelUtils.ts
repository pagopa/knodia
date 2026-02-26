import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  readmodelEservice,
  readmodelEserviceCategory,
  readmodelEserviceInterface,
  readmodelEserviceVersion,
  readmodelEserviceVersionRequiredAttribute,
} from "@knodia/db-readmodel-eservice";
import { aggregateEservices } from "@knodia/db-readmodel-eservice/converters";
import {
  readmodelKeychain,
  readmodelKeychainKey,
  readmodelKeychainPurpose,
  readmodelKeychainUser,
} from "@knodia/db-readmodel-keychain";
import { aggregateKeychains } from "@knodia/db-readmodel-keychain/converters";
import { eq } from "drizzle-orm";

export async function getAllEservices(readmodelDb: NodePgDatabase) {
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

  return aggregateEservices(queryRes);
}

export async function getAllKeychains(readmodelDb: NodePgDatabase) {
  const queryRes = await readmodelDb
    .select({
      key: readmodelKeychainKey,
      keychain: readmodelKeychain,
      purpose: readmodelKeychainPurpose,
      user: readmodelKeychainUser,
    })
    .from(readmodelKeychain)
    .leftJoin(
      readmodelKeychainPurpose,
      eq(readmodelKeychain.id, readmodelKeychainPurpose.keychainId),
    )
    .leftJoin(
      readmodelKeychainUser,
      eq(readmodelKeychain.id, readmodelKeychainUser.keychainId),
    )
    .leftJoin(
      readmodelKeychainKey,
      eq(readmodelKeychain.id, readmodelKeychainKey.keychainId),
    );

  return aggregateKeychains(queryRes);
}
