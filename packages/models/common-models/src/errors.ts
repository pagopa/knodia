type CommonInternalErrors =
  | "GENERIC_INTERNAL_ERROR"
  | "KAFKA_MESSAGE_PROCESS_ERROR"
  | "MISSING_KAFKA_MESSAGE_DATA";
export class InternalError<T> extends Error {
  public code: T;
  public detail: string;

  constructor({ code, detail }: { code: T; detail: string }) {
    super(detail);
    this.code = code;
    this.detail = detail;
  }
}

export function genericInternalError(
  message: string,
): InternalError<CommonInternalErrors> {
  return new InternalError({
    code: "GENERIC_INTERNAL_ERROR",
    detail: message,
  });
}

export function kafkaMessageProcessError(
  topic: string,
  partition: number,
  offset: string,
  cause: unknown,
): InternalError<CommonInternalErrors> {
  const error = new InternalError<CommonInternalErrors>({
    code: "KAFKA_MESSAGE_PROCESS_ERROR",
    detail: `Error handling Kafka message. Topic: ${topic}. Partition number: ${partition}. Offset: ${offset}. Cause: ${cause instanceof Error ? cause.message : String(cause)}`,
  });
  // Chain the root cause on the instance (Error supports `cause`) so the whole
  // chain survives to any downstream catcher, without touching the shared class.
  error.cause = cause;
  return error;
}

export function missingKafkaMessageDataError(
  dataName: string,
  eventType: string,
): InternalError<CommonInternalErrors> {
  return new InternalError({
    code: "MISSING_KAFKA_MESSAGE_DATA",
    detail: `Invalid message: missing data '${dataName}' in ${eventType} event`,
  });
}
