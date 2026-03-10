import type {
  EserviceVersionId,
  OrganizationId,
} from "@knodia/common-models/ids";
import type { Eservice, EserviceVersionState } from "@knodia/eservice-models";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  eserviceVersionNotInExpectedState,
  requesterIsNotProducer,
} from "../models/errors.ts";
import { retrieveEserviceVersion } from "./readmodelUtils.ts";

export const assertEserviceVersionIsActive = async (
  eservice: Eservice,
  eserviceVersionId: EserviceVersionId,
  readmodelService: ReadmodelService,
) => {
  const allowedStates: EserviceVersionState[] = ["Active"];
  const eserviceVersion = await retrieveEserviceVersion(
    eservice.id,
    eserviceVersionId,
    readmodelService,
  );

  if (!allowedStates.includes(eserviceVersion.state)) {
    throw eserviceVersionNotInExpectedState(
      eservice.id,
      eserviceVersionId,
      allowedStates,
    );
  }
};

export const assertRequesterIsProducer = (
  producerId: OrganizationId,
  authData: UISessionAuthData,
) => {
  if (authData.organizationId !== producerId) {
    throw requesterIsNotProducer(producerId, authData.organizationId);
  }
};
