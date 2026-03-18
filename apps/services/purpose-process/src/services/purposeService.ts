import type { PurposeId } from "@knodia/common-models/ids";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { Purpose } from "@knodia/purpose-models";

import { generateExternalId } from "@knodia/common-models/externalResource";
import { unsafeBrandId } from "@knodia/common-models/ids";

export type PurposeService = ReturnType<typeof purposeServiceBuilder>;

export function purposeServiceBuilder() {
  return {
    async getPurpose(
      purposeId: PurposeId,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<Purpose> {
      logger.info(`Getting Purpose with ID ${purposeId}`);
      // TODO: unmock — replace with actual readmodel query
      const now = new Date();
      return {
        consumer: {
          id: generateExternalId(),
          knodeId: "Orion",
        },
        createdAt: now,
        dailyCalls: 1000,
        description: { en: "Mock purpose description" },
        eserviceId: unsafeBrandId(purposeId),
        formAnswers: {},
        id: unsafeBrandId(purposeId),
        name: { en: "Mock purpose" },
        state: "Active",
        updatedAt: now,
      };
    },
  };
}
