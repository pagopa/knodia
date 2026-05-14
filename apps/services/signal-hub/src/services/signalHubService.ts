import type { EserviceId } from "@knodia/common-models/ids";
import type { SignalHubSignalSQL } from "@knodia/db-signal-hub";
import type { SignalHubDbService } from "@knodia/db-signal-hub/services";
import type { KnodeApiAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import type { ReadmodelService } from "./readmodelService.ts";

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
        timeWindowInSeconds,
      }: {
        eserviceId: EserviceId;
        objectId: string;
        objectType: string;
        signalId: number;
        signalType: string;
        timeWindowInSeconds: number;
      },
      { authData, correlationId, logger }: AuthorizedContext<KnodeApiAuthData>,
    ) {
      logger.info(`Pushing signal ${signalId} for E-service ${eserviceId}`);

      const { organization } = authData;

      await Promise.all([
        assertEserviceIsActiveWithSignalHubEnabled(
          eserviceId,
          organization.id,
          readmodelService,
        ),
        assertSignalCanBePushed(
          signalId,
          eserviceId,
          timeWindowInSeconds,
          signalHubDbService,
        ),
      ]);

      const signal: Omit<SignalHubSignalSQL, "id"> = {
        correlationId,
        createdAt: new Date(),
        eserviceId,
        objectId,
        objectType,
        signalId,
        signalType,
      };
      await signalHubDbService.insertSignal(signal);
    },
  };
}
