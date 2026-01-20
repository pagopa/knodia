import type { ApiError } from "@knodia/fastify-zod-api-commons/models/apiError";
import type { CommonErrorCodes } from "@knodia/fastify-zod-api-commons/models/errors";

import { constants } from "http2";
import { match } from "ts-pattern";

import type { ErrorCodes as LocalErrorCodes } from "../models/errors.ts";

type ErrorCodes = CommonErrorCodes | LocalErrorCodes;

const { HTTP_STATUS_INTERNAL_SERVER_ERROR, HTTP_STATUS_NOT_FOUND } = constants;

export const eserviceErrorMapper = (error: ApiError<ErrorCodes>): number =>
  match(error.code)
    .with("ESERVICE_NOT_FOUND", () => HTTP_STATUS_NOT_FOUND)
    .otherwise(() => HTTP_STATUS_INTERNAL_SERVER_ERROR);
