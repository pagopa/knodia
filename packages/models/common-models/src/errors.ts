type CommonInternalErrors =
  | "GENERIC_INTERNAL_ERROR"
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

export function missingKafkaMessageDataError(
  dataName: string,
  eventType: string,
): InternalError<CommonInternalErrors> {
  return new InternalError({
    code: "MISSING_KAFKA_MESSAGE_DATA",
    detail: `Invalid message: missing data '${dataName}' in ${eventType} event`,
  });
}
