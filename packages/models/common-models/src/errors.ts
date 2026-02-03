/* eslint-disable perfectionist/sort-objects */
export const commonErrorCodes = {
  GENERIC_ERROR: "9991",
  ZOD_FASTIFY_SCHEMA_VALIDATION_ERROR: "9992",
  RESPONSE_SERIALIZATION_ERROR: "9993",
  MISSING_HEADER: "9994",
  FASTIFY_ERROR: "9995",
  MISSING_KAFKA_MESSAGE_DATA: "9996",
} as const;
/* eslint-enable perfectionist/sort-objects */
export type CommonErrorCodes = keyof typeof commonErrorCodes;

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
): InternalError<CommonErrorCodes> {
  return new InternalError({
    code: "GENERIC_ERROR",
    detail: message,
  });
}

export function missingKafkaMessageDataError(
  dataName: string,
  eventType: string,
): InternalError<CommonErrorCodes> {
  return new InternalError({
    code: "MISSING_KAFKA_MESSAGE_DATA",
    detail: `Invalid message: missing data '${dataName}' in ${eventType} event`,
  });
}
