import { constants } from "http2";
import { match } from "ts-pattern";

import type { CommonErrorCodes } from "../../models/errors/errors.ts";

const { HTTP_STATUS_INTERNAL_SERVER_ERROR } = constants;

export const defaultCommonErrorMapper = (code: CommonErrorCodes): number =>
  match(code).otherwise(() => HTTP_STATUS_INTERNAL_SERVER_ERROR);

export const emptyErrorMapper = (): number => HTTP_STATUS_INTERNAL_SERVER_ERROR;
