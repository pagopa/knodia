import {
  ConsumerKeychainId,
  KeyId,
  PurposeId,
} from "@knodia/common-models/ids";
import { type JWTPayload, type ProtectedHeaderParameters } from "jose";

import {
  ClientAssertionHeader,
  ClientAssertionPayload,
} from "../models/clientAssertion.ts";
import {
  ALLOWED_CLIENT_ASSERTION_ALGORITHM,
  ALLOWED_CLIENT_ASSERTION_TYP,
} from "../models/constants.ts";
import {
  algNotFound,
  algNotSupported,
  audNotFound,
  clientAssertionInvalidClaims,
  expNotFound,
  iatNotFound,
  invalidAud,
  invalidIss,
  invalidIssFormat,
  invalidKidFormat,
  invalidPurposeIdFormat,
  invalidSub,
  invalidSubFormat,
  issNotFound,
  jtiNotFound,
  kidNotFound,
  purposeIdNotFound,
  subNotFound,
  typNotFound,
  typNotSupported,
} from "../models/errors.ts";
import {
  failedValidation,
  successfulValidation,
  type ValidationResult,
} from "../models/validation.ts";

export function checkAlg(
  alg: ProtectedHeaderParameters["alg"],
): ValidationResult<typeof ALLOWED_CLIENT_ASSERTION_ALGORITHM> {
  if (!alg) {
    return failedValidation([algNotFound()]);
  }

  if (alg === ALLOWED_CLIENT_ASSERTION_ALGORITHM) {
    return successfulValidation(alg);
  }
  return failedValidation([algNotSupported(alg)]);
}

export function checkAud(
  receivedAud: JWTPayload["aud"],
  clientAssertionAcceptedAudiences: string[],
): ValidationResult<string | string[]> {
  if (!receivedAud) {
    return failedValidation([audNotFound()]);
  }

  if (Array.isArray(receivedAud)) {
    if (
      clientAssertionAcceptedAudiences.some((entry) =>
        receivedAud.includes(entry),
      )
    ) {
      return successfulValidation(receivedAud);
    }
    return failedValidation([
      invalidAud(receivedAud, clientAssertionAcceptedAudiences),
    ]);
  } else {
    if (
      clientAssertionAcceptedAudiences.some((entry) => receivedAud === entry)
    ) {
      return successfulValidation(receivedAud);
    }
    return failedValidation([
      invalidAud(receivedAud, clientAssertionAcceptedAudiences),
    ]);
  }
}

export function checkClientAssertionStrictClaims(
  clientAssertionHeader: ProtectedHeaderParameters,
  clientAssertionPayload: JWTPayload,
): ValidationResult<void> {
  const headerParseResult = ClientAssertionHeader.safeParse(
    clientAssertionHeader,
  );
  const payloadParseResult = ClientAssertionPayload.safeParse(
    clientAssertionPayload,
  );

  if (!headerParseResult.success || !payloadParseResult.success) {
    return failedValidation([
      !headerParseResult.success
        ? clientAssertionInvalidClaims(headerParseResult.error, "header")
        : undefined,
      !payloadParseResult.success
        ? clientAssertionInvalidClaims(payloadParseResult.error, "payload")
        : undefined,
    ]);
  }

  return successfulValidation(undefined);
}

export function checkExp(exp: JWTPayload["exp"]): ValidationResult<number> {
  if (!exp) {
    return failedValidation([expNotFound()]);
  }

  return successfulValidation(exp);
}

export function checkIat(iat: JWTPayload["iat"]): ValidationResult<number> {
  if (!iat) {
    return failedValidation([iatNotFound()]);
  }

  return successfulValidation(iat);
}

export function checkIss(
  consumerKeychainId: string,
  iss: JWTPayload["iss"],
): ValidationResult<ConsumerKeychainId> {
  if (!iss) {
    return failedValidation([issNotFound()]);
  }

  const issParseResult = ConsumerKeychainId.safeParse(iss);
  if (!issParseResult.success) {
    return failedValidation([invalidIssFormat(iss)]);
  }

  if (iss !== consumerKeychainId) {
    return failedValidation([invalidIss(iss, consumerKeychainId)]);
  }

  return successfulValidation(issParseResult.data);
}

export function checkJti(jti: JWTPayload["jti"]): ValidationResult<string> {
  if (!jti) {
    return failedValidation([jtiNotFound()]);
  }

  return successfulValidation(jti);
}

export function checkKid(
  kid: ProtectedHeaderParameters["kid"],
): ValidationResult<KeyId> {
  if (!kid) {
    return failedValidation([kidNotFound()]);
  }

  const kidParseResult = KeyId.safeParse(kid);
  if (kidParseResult.success) {
    return successfulValidation(kidParseResult.data);
  }

  return failedValidation([invalidKidFormat(kid)]);
}

export function checkPurposeId(
  purposeId: unknown,
): ValidationResult<PurposeId> {
  if (purposeId === undefined) {
    return failedValidation([purposeIdNotFound()]);
  }

  const purposeIdParseResult = PurposeId.safeParse(purposeId);
  if (purposeIdParseResult.success) {
    return successfulValidation(purposeIdParseResult.data);
  }

  return failedValidation([invalidPurposeIdFormat(purposeId)]);
}

export function checkSub(
  consumerKeychainId: string,
  sub: JWTPayload["sub"],
): ValidationResult<ConsumerKeychainId> {
  if (!sub) {
    return failedValidation([subNotFound()]);
  }

  const subParseResult = ConsumerKeychainId.safeParse(sub);
  if (!subParseResult.success) {
    return failedValidation([invalidSubFormat(sub)]);
  }

  if (sub !== consumerKeychainId) {
    return failedValidation([invalidSub(sub, consumerKeychainId)]);
  }

  return successfulValidation(subParseResult.data);
}

export function checkTyp(
  typ: ProtectedHeaderParameters["typ"],
): ValidationResult<typeof ALLOWED_CLIENT_ASSERTION_TYP> {
  if (!typ) {
    return failedValidation([typNotFound()]);
  }

  if (typ === ALLOWED_CLIENT_ASSERTION_TYP) {
    return successfulValidation(typ);
  }
  return failedValidation([typNotSupported(typ)]);
}
