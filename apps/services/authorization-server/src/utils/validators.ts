import type { Agreement } from "@knodia/agreement-models";
import type { ExternalResource } from "@knodia/common-models/externalResource";
import type { OrganizationId, PurposeId } from "@knodia/common-models/ids";
import type { EserviceVersion } from "@knodia/eservice-models";
import type { Purpose } from "@knodia/purpose-models";

import { hasAllRequiredAttributes } from "@knodia/attribute-models";
import {
  createPublicKey,
  decodeBase64Pem,
} from "@knodia/fastify-zod-api-commons/crypto";
import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";
import { isAxiosError } from "axios";
import { decodeJwt, decodeProtectedHeader, jwtVerify } from "jose";
import {
  JWSInvalid,
  JWSSignatureVerificationFailed,
  JWTClaimValidationFailed,
  JWTExpired,
} from "jose/errors";
import { ZodError } from "zod";

import type { API_TokenRequest } from "../models/api.ts";
import type { ReadmodelService } from "../services/readmodelService.ts";

import { ClientAssertion } from "../models/clientAssertion.ts";
import {
  agreementNotActive,
  clientAssertionClaimsValidationError,
  clientAssertionExpired,
  consumerMissingRequiredAttributes,
  eserviceVersionNotActive,
  invalidClientAssertionSignature,
  jsonWebTokenError,
  platformStatesNotActive,
  purposeNotActive,
  unexpectedClientAssertionSignatureVerificationError,
} from "../models/errors.ts";
import {
  retrieveAgreement,
  retrieveEserviceVersion,
  retrievePurpose,
} from "./readmodelUtils.ts";

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
  {
    client_assertion: clientAssertionJws,
    client_id: clientId,
  }: API_TokenRequest,
  clientAssertionAcceptedAudiences: string[],
  clientAssertionClockToleranceSeconds: number,
  clientAssertionMaxTokenAgeSeconds: number,
  k2kGatewayClient: K2K2GatewayApiClient,
) {
  try {
    const protectedHeader = decodeProtectedHeader(clientAssertionJws);
    const payload = decodeJwt(clientAssertionJws);

    const {
      header: { kid },
      payload: { purposeId },
    } = ClientAssertion.parse({
      header: protectedHeader,
      payload,
    });

    const {
      data: { consumerAttributes, publicKey },
    } = await k2kGatewayApi.getClientAssertionVerificationData({
      body: {
        keychainId: clientId,
        kid,
        purposeId,
      },
      client: k2kGatewayClient,
    });

    const verificationKey = createPublicKey({
      pemKey: decodeBase64Pem(publicKey.encodedPem),
    });

    await jwtVerify(clientAssertionJws, verificationKey, {
      algorithms: [publicKey.algorithm],
      audience: clientAssertionAcceptedAudiences,
      clockTolerance: clientAssertionClockToleranceSeconds,
      issuer: clientId,
      maxTokenAge: clientAssertionMaxTokenAgeSeconds,
      subject: clientId,
      typ: "JWT",
    });

    return {
      consumerAttributes,
      purposeId,
    };
  } catch (error) {
    if (error instanceof JWTExpired) {
      throw clientAssertionExpired();
    } else if (
      error instanceof JWTClaimValidationFailed ||
      error instanceof ZodError
    ) {
      throw clientAssertionClaimsValidationError(clientId, error);
    } else if (error instanceof JWSSignatureVerificationFailed) {
      throw invalidClientAssertionSignature();
    } else if (error instanceof JWSInvalid) {
      throw jsonWebTokenError(error.message);
    } else if (isAxiosError(error)) {
      throw error;
    } else {
      throw unexpectedClientAssertionSignatureVerificationError(error);
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
    throw platformStatesNotActive([
      agreementStateError,
      eserviceVersionError,
      purposeError,
    ]);
  }
}
