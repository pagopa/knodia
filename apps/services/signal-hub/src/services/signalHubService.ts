import type { EserviceId } from "@knodia/common-models/ids";
import type { SignalHubSignalSQL } from "@knodia/db-signal-hub";
import type { SignalHubDbService } from "@knodia/db-signal-hub/services";
import type { KnodeApiAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { SignalType } from "@knodia/signal-hub-models";

import { PG_UNIQUE_VIOLATION } from "@knodia/common-models/pgErrorCodes";
import { DrizzleQueryError } from "drizzle-orm";
import { DatabaseError } from "pg";

import type { ReadmodelService } from "./readmodelService.ts";

import { signalAlreadyExists } from "../models/errors.ts";
import {
  assertEserviceIsActiveWithSignalHubEnabled,
  assertSignalCanBePushed,
} from "../utils/validators.ts";

export type SignalHubService = ReturnType<typeof signalHubServiceBuilder>;

export function signalHubServiceBuilder(
  readmodelService: ReadmodelService,
  signalHubDbService: SignalHubDbService,
) {
  return {
    async pushSignal(
      {
        eserviceId,
        objectId,
        objectType,
        signalId,
        signalType,
      }: {
        eserviceId: EserviceId;
        objectId: string;
        objectType: string;
        signalId: number;
        signalType: SignalType;
      },
      { authData, correlationId, logger }: AuthorizedContext<KnodeApiAuthData>,
    ) {
      logger.info(`Pushing signal ${signalId} for E-service ${eserviceId}`);

      const { organization } = authData;

      await assertEserviceIsActiveWithSignalHubEnabled(
        eserviceId,
        organization.id,
        readmodelService,
      );
      await assertSignalCanBePushed(signalId, eserviceId, signalHubDbService);

      const signal: Omit<SignalHubSignalSQL, "id"> = {
        correlationId,
        createdAt: new Date(),
        eserviceId,
        objectId,
        objectType,
        signalId,
        signalType,
      };

      try {
        await signalHubDbService.insertSignal(signal);
      } catch (error) {
        logger.error(
          { error },
          `Failed to insert signal ${signalId} for E-service ${eserviceId}`,
        );
        if (
          error instanceof DrizzleQueryError &&
          error.cause instanceof DatabaseError &&
          error.cause?.code === PG_UNIQUE_VIOLATION
        ) {
          // Race condition: in case two concurrent signals pass the checks above, we get a PG unique constraint violation error, and we rethrow a meaningful error
          throw signalAlreadyExists(signalId, eserviceId);
        }
        throw error;
      }
    },
  };
}
