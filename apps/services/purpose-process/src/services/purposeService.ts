import type { PurposeId } from "@knodia/common-models/ids";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { Purpose } from "@knodia/purpose-models";

import type { ReadmodelService } from "./readmodelService.ts";

import { retrievePurpose } from "../utils/readmodelUtils.ts";

export type PurposeService = ReturnType<typeof purposeServiceBuilder>;

export function purposeServiceBuilder(readmodelService: ReadmodelService) {
  return {
    async getPurpose(
      purposeId: PurposeId,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<Purpose> {
      logger.info(`Getting Purpose with ID ${purposeId}`);

      return await retrievePurpose(purposeId, readmodelService);
    },
  };
}
