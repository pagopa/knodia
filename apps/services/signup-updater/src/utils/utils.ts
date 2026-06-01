import type { EachMessagePayload } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { CognitoIdmClient } from "@knodia/cognito-idm-client";
import type { SignupDbService } from "@knodia/db-signup/services";
import type { OrganizationProcessClient } from "@knodia/organization-process-client";
import type { RefreshableInternalTokenGenerator } from "@knodia/token-generator/refreshable";
import type { Logger } from "pino";

import {
  type CorrelationId,
  generateId,
  type KnodeId,
} from "@knodia/common-models/ids";
import { decodeKafkaJsonMessage } from "@knodia/kafka-commons/utils";
import { SignupEventV1 } from "@knodia/signup-models";

import { handleSignupMessage } from "../services/consumerService.ts";

export interface SignupUpdaterDeps {
  internalTokenProvider: RefreshableInternalTokenGenerator;
  nodeClients: Record<
    KnodeId,
    { cognitoClient: CognitoIdmClient; orgClient: OrganizationProcessClient }
  >;
  signupDbService: SignupDbService;
}

export const createProcessMessage = (deps: SignupUpdaterDeps, logger: Logger) =>
  async function processMessage({
    message,
    partition,
  }: EachMessagePayload): Promise<void> {
    // Signup events are plain JSON (not protobuf / event-store CDC), so they
    // carry no envelope: parse + validate the value and mint a correlationId.
    const event = decodeKafkaJsonMessage(message, SignupEventV1);
    const correlationId = generateId<CorrelationId>();
    const messageLogger = logger.child({
      correlationId,
      eventType: event.type,
    });

    await handleSignupMessage(event, deps, correlationId, messageLogger);

    messageLogger.info(
      `Signup message processed. Partition number: ${partition}. Offset: ${message.offset}`,
    );
  };
