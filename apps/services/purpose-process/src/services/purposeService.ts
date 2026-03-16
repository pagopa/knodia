import type { PurposeId } from "@knodia/common-models/ids";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { Purpose } from "@knodia/purpose-models";

import type { ReadmodelService } from "./readmodelService.ts";

import { purposeNotFound } from "../models/errors.ts";

export type PurposeService = ReturnType<typeof purposeServiceBuilder>;

export function purposeServiceBuilder(readmodelService: ReadmodelService) {
  return {
    async getPurpose(
      purposeId: PurposeId,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<Purpose> {
      logger.info(`Getting Purpose with ID ${purposeId}`);

      const result = await readmodelService.getPurpose(purposeId);

      if (!result) {
        throw purposeNotFound(purposeId);
      }

      return result.data;
    },
  };
}
