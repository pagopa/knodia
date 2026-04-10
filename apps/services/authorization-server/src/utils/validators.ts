import { genericError } from "@knodia/fastify-zod-api-commons/models";
import {
  decodeJwt,
  decodeProtectedHeader,
  type JWTPayload,
  type ProtectedHeaderParameters,
} from "jose";
import { JWTInvalid } from "jose/errors";

import type { API_TokenRequest } from "../models/api.ts";

import { type ClientAssertion } from "../models/clientAssertion.ts";
import {
  clientAssertionClaimsValidationError,
  invalidClientAssertionFormat,
} from "../models/errors.ts";
import { failedValidation } from "../models/validation.ts";
import {
  checkAlg,
  checkAud,
  checkClientAssertionStrictClaims,
  checkExp,
  checkIat,
  checkIss,
  checkJti,
  checkKid,
  checkPurposeId,
  checkSub,
  checkTyp,
} from "./utils.ts";

export const validateClientAssertionClaims = ({
  client_assertion: clientAssertionJWS,
  consumer_keychain_id: consumerKeychainId,
}: Pick<
  API_TokenRequest,
  "client_assertion" | "consumer_keychain_id"
>): ClientAssertion => {
  let decodedHeader: ProtectedHeaderParameters;
  let decodedPayload: JWTPayload;
  try {
    decodedHeader = decodeProtectedHeader(clientAssertionJWS);
    decodedPayload = decodeJwt(clientAssertionJWS);
  } catch (error) {
    if (error instanceof JWTInvalid) {
      throw clientAssertionClaimsValidationError(consumerKeychainId, [
        invalidClientAssertionFormat(error.message),
      ]);
    }
    const message = error instanceof Error ? error.message : "Generic Error";
    throw clientAssertionClaimsValidationError(consumerKeychainId, [
      genericError(message),
    ]);
  }

  const { data: alg, errors: algErrors } = checkAlg(decodedHeader.alg);
  const { data: kid, errors: kidErrors } = checkKid(decodedHeader.kid);
  const { data: typ, errors: typErrors } = checkTyp(decodedHeader.typ);

  const { data: aud, errors: audErrors } = checkAud(decodedPayload.aud);
  const { data: exp, errors: expErrors } = checkExp(decodedPayload.exp);
  const { data: iat, errors: iatErrors } = checkIat(decodedPayload.iat);
  const { data: iss, errors: issErrors } = checkIss(
    consumerKeychainId,
    decodedPayload.iss,
  );
  const { data: jti, errors: jtiErrors } = checkJti(decodedPayload.jti);
  const { data: purposeId, errors: purposeIdErrors } = checkPurposeId(
    decodedPayload["purpose_id"],
  );
  const { data: sub, errors: subErrors } = checkSub(
    consumerKeychainId,
    decodedPayload.sub,
  );
  const { errors: parsingErrors } = checkClientAssertionStrictClaims(
    decodedHeader,
    decodedPayload,
  );

  if (
    algErrors ||
    kidErrors ||
    typErrors ||
    audErrors ||
    expErrors ||
    iatErrors ||
    issErrors ||
    jtiErrors ||
    purposeIdErrors ||
    subErrors ||
    parsingErrors
  ) {
    const { errors } = failedValidation([
      algErrors,
      typErrors,
      audErrors,
      expErrors,
      iatErrors,
      issErrors,
      jtiErrors,
      kidErrors,
      purposeIdErrors,
      subErrors,
      parsingErrors,
    ]);

    throw clientAssertionClaimsValidationError(consumerKeychainId, errors);
  }

  return {
    header: {
      alg,
      kid,
      typ,
    },
    payload: {
      aud,
      exp,
      iat,
      iss,
      jti,
      purpose_id: purposeId,
      sub,
    },
  };
};
