import {
  CorrelationId,
  OrganizationId,
  UserId,
} from "@knodia/common-models/ids";

export type LoggerMetadata = LoggerMetadataFastify | LoggerMetadataKafka;

export interface LoggerMetadataFastify extends LoggerMetadataCommon {
  organizationId: OrganizationId;
  userId: UserId;
}

export interface LoggerMetadataKafka extends LoggerMetadataCommon {
  eventType: string;
  eventVersion: number;
  streamId: string;
  streamVersion: number;
}

interface LoggerMetadataCommon {
  correlationId: CorrelationId;
}
