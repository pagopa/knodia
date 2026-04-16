import type { Agreement } from "@knodia/agreement-models";
import type { Algorithm } from "@knodia/common-models/algorithms";
import type { ExternalResource } from "@knodia/common-models/externalResource";
import type { EserviceVersion } from "@knodia/eservice-models";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";
import type { Purpose } from "@knodia/purpose-models";

import { hasAllRequiredAttributes } from "@knodia/attribute-models";
import { type OrganizationId, type PurposeId } from "@knodia/common-models/ids";
import {
  createPublicKey,
  decodeBase64Pem,
} from "@knodia/fastify-zod-api-commons/crypto";
import { genericError } from "@knodia/fastify-zod-api-commons/models";
import {
  decodeJwt,
  decodeProtectedHeader,
  type JWTPayload,
  jwtVerify,
  type ProtectedHeaderParameters,
} from "jose";
import {
  JOSEError,
  JWSInvalid,
  JWSSignatureVerificationFailed,
  JWTExpired,
  JWTInvalid,
} from "jose/errors";
import z from "zod";

import type { API_TokenRequest } from "../models/api.ts";
import type { ReadmodelService } from "../services/readmodelService.ts";

import { type ClientAssertion } from "../models/clientAssertion.ts";
import {
  agreementNotActive,
  clientAssertionClaimsValidationError,
  clientAssertionExpired,
  consumerMissingRequiredAttributes,
  eserviceVersionNotActive,
  invalidClientAssertionFormat,
  invalidClientAssertionSignature,
  jsonWebTokenError,
  platformStatesNotActive,
  purposeNotActive,
  unexpectedClientAssertionSignatureVerificationError,
} from "../models/errors.ts";
import { failedValidation } from "../models/validation.ts";
import {
  retrieveAgreement,
  retrieveEserviceVersion,
  retrievePurpose,
} from "./readmodelUtils.ts";
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

export const validateClientAssertionClaims = (
  {
    client_assertion: clientAssertionJWS,
    client_id: consumerKeychainId,
  }: Pick<API_TokenRequest, "client_assertion" | "client_id">,
  clientAssertionAcceptedAudiences: string[],
): ClientAssertion => {
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

  const { data: aud, errors: audErrors } = checkAud(
    decodedPayload.aud,
    clientAssertionAcceptedAudiences,
  );
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
      purposeId,
      sub,
    },
  };
};

export async function validatePlatformObjects(
  purposeId: PurposeId,
  consumerAttributes: k2kGatewayApi.Attribute[],
  readmodelService: ReadmodelService,
) {
  const { data: purpose } = await retrievePurpose(purposeId, readmodelService);
  const { data: agreement } = await retrieveAgreement(
    purpose.consumer,
    purpose.eserviceId,
    readmodelService,
  );
  const eserviceVersion = await retrieveEserviceVersion(
    agreement.eserviceId,
    agreement.eserviceVersionId,
    readmodelService,
  );

  assertPlatformStatesAreActive(purpose, agreement, eserviceVersion);
  assertConsumerAttributesMeetEserviceRequirements(
    eserviceVersion,
    consumerAttributes,
    purpose.consumer,
  );

  return {
    agreement,
    eserviceVersion,
    purpose,
  };
}

export async function verifyClientAssertionSignature(
  clientAssertionJws: string,
  publicKeyForVerification: k2kGatewayApi.PublicKeyForVerification,
  clientAssertionAlgorithm: Algorithm,
): Promise<JWTPayload> {
  try {
    if (!z.base64().safeParse(publicKeyForVerification.encodedPem).success) {
      // Unexpected, because we always store public keys
      // in base64 encoded PEM format
      throw unexpectedClientAssertionSignatureVerificationError(
        "Public Key shall be a base64 encoded PEM",
      );
    }

    const publicKey = createPublicKey({
      pemKey: decodeBase64Pem(publicKeyForVerification.encodedPem),
    });

    const result = await jwtVerify(clientAssertionJws, publicKey, {
      algorithms: [clientAssertionAlgorithm],
    });

    return result.payload;
  } catch (error: unknown) {
    if (error instanceof JWTExpired) {
      throw clientAssertionExpired();
    } else if (error instanceof JWSSignatureVerificationFailed) {
      throw invalidClientAssertionSignature();
    } else if (error instanceof JWSInvalid) {
      throw jsonWebTokenError(error.message);
    } else if (error instanceof JOSEError) {
      throw unexpectedClientAssertionSignatureVerificationError(error.message);
    } else {
      const message = error instanceof Error ? error.message : "generic error";
      throw unexpectedClientAssertionSignatureVerificationError(message);
    }
  }
}

function assertConsumerAttributesMeetEserviceRequirements(
  {
    id: eserviceVersionId,
    requiredAttributes,
  }: Pick<EserviceVersion, "id" | "requiredAttributes">,
  consumerAttributes: k2kGatewayApi.Attribute[],
  consumer: ExternalResource<OrganizationId>,
) {
  if (!hasAllRequiredAttributes(consumerAttributes, requiredAttributes)) {
    throw consumerMissingRequiredAttributes(consumer, eserviceVersionId);
  }
}

function assertPlatformStatesAreActive(
  purpose: Purpose,
  agreement: Agreement,
  eserviceVersion: Omit<EserviceVersion, "interfaceDocument">,
) {
  const agreementStateError =
    agreement.state !== "Active"
      ? agreementNotActive(agreement.id, agreement.state)
      : undefined;

  const eserviceVersionError =
    eserviceVersion.state !== "Active"
      ? eserviceVersionNotActive(eserviceVersion.id, eserviceVersion.state)
      : undefined;

  const purposeError =
    purpose.state !== "Active"
      ? purposeNotActive(purpose.id, purpose.state)
      : undefined;

  if (agreementStateError || eserviceVersionError || purposeError) {
    const { errors } = failedValidation([
      agreementStateError,
      eserviceVersionError,
      purposeError,
    ]);

    throw platformStatesNotActive(errors);
  }
}
