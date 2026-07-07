import type { EserviceId } from "@knodia/common-models/ids";
import type { SignalHubSignalSQL } from "@knodia/db-signal-hub";
import type { SignalHubDbService } from "@knodia/db-signal-hub/services";
import type { KnodeApiAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import { toExternalResource } from "@knodia/common-models/externalResource";
import { isPgUniqueViolation } from "@knodia/common-models/utils";
import { type SignalSeed, SignalType } from "@knodia/signal-hub-models";
import { match } from "ts-pattern";

import type { ReadmodelService } from "./readmodelService.ts";

import { signalAlreadyExists } from "../models/errors.ts";
import { retrieveEserviceById } from "../utils/readmodelUtils.ts";
import {
  assertEserviceIsActiveWithSignalHubEnabled,
  assertOrganizationAuthorizedToPullSignals,
  assertOrganizationAuthorizedToPushSignals,
  assertSignalCanBePushed,
} from "../utils/validators.ts";

export type SignalHubService = ReturnType<typeof signalHubServiceBuilder>;

export function signalHubServiceBuilder(
  readmodelService: ReadmodelService,
  signalHubDbService: SignalHubDbService,
) {
  return {
    async pullSignals(
      {
        eserviceId,
        signalId,
        size,
      }: {
        eserviceId: EserviceId;
        signalId: number;
        size: number;
      },
      { authData, logger }: AuthorizedContext<KnodeApiAuthData>,
    ) {
      logger.info(`Pulling signals for E-service ${eserviceId}`);

      const { organization } = authData;

      const { data: eservice } = await retrieveEserviceById(
        eserviceId,
        readmodelService,
      );

      await assertOrganizationAuthorizedToPullSignals(
        toExternalResource(organization.id, organization.knodeId),
        eserviceId,
        readmodelService,
      );
      assertEserviceIsActiveWithSignalHubEnabled(eservice);

      return await signalHubDbService.getSignals(signalId, eserviceId, size);
    },
    async pushSignal(
      seed: SignalSeed,
      { authData, correlationId, logger }: AuthorizedContext<KnodeApiAuthData>,
    ) {
      const { eserviceId, signalId, signalType } = seed;

      logger.info(`Pushing signal ${signalId} for E-service ${eserviceId}`);

      const { data: eservice } = await retrieveEserviceById(
        eserviceId,
        readmodelService,
      );

      assertOrganizationAuthorizedToPushSignals(
        eservice,
        authData.organization.id,
      );
      assertEserviceIsActiveWithSignalHubEnabled(eservice);
      await assertSignalCanBePushed(signalId, eserviceId, signalHubDbService);

      // SeedUpdate signals reference no object, so their object columns are null.
      const { objectId, objectType } = match(seed)
        .with({ signalType: SignalType.enum.SeedUpdate }, () => ({
          objectId: null,
          objectType: null,
        }))
        .with(
          { signalType: SignalType.enum.Create },
          { signalType: SignalType.enum.Update },
          { signalType: SignalType.enum.Delete },
          ({ objectId, objectType }) => ({ objectId, objectType }),
        )
        .exhaustive();

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
          { err: error },
          `Failed to insert signal ${signalId} for E-service ${eserviceId}`,
        );
        if (isPgUniqueViolation(error)) {
          // Race condition: in case two concurrent signals pass the checks above, we get a PG unique constraint violation error, and we rethrow a meaningful error
          throw signalAlreadyExists(signalId, eserviceId);
        }
        throw error;
      }
    },
  };
}
