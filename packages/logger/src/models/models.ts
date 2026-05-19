import {
  type CorrelationId,
  type KnodeId,
  type OrganizationId,
  type UserId,
} from "@knodia/common-models/ids";

export interface HTTPServiceLoggerMetadata extends LoggerMetadataCommon {
  organizationId?: OrganizationId;
  organizationKnodeId?: KnodeId;
  userId?: UserId;
}

export interface KafkaConsumerLoggerMetadata extends LoggerMetadataCommon {
  eventType: string;
  eventVersion: number;
  streamId: string;
  streamVersion: number;
}

export type LoggerMetadata =
  | HTTPServiceLoggerMetadata
  | KafkaConsumerLoggerMetadata;

interface LoggerMetadataCommon {
  correlationId: CorrelationId;
}
