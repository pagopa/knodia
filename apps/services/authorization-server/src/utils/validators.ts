import type { Agreement } from "@knodia/agreement-models";
import type { ExternalResource } from "@knodia/common-models/externalResource";
import type {
  ConsumerKeychainId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";
import type { EserviceVersion } from "@knodia/eservice-models";
import type { Purpose } from "@knodia/purpose-models";
import type { FastifyBaseLogger } from "fastify";

import { hasAllRequiredAttributes } from "@knodia/attribute-models";
import { type Algorithm } from "@knodia/common-models/algorithms";
import {
  createPublicKey,
  decodeBase64Pem,
} from "@knodia/fastify-zod-api-commons/crypto";
import { ApiError } from "@knodia/fastify-zod-api-commons/models";
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
import { match } from "ts-pattern";
import { ZodError } from "zod";

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
  publicKeyAlgNotMatchingClientAssertionAlg,
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
    clientAssertionJWS,
    consumerKeychainId,
  }: {
    clientAssertionJWS: string;
    consumerKeychainId: ConsumerKeychainId;
  },
  clientAssertionAcceptedAudiences: string[],
  clientAssertionClockToleranceSeconds: number,
  clientAssertionMaxTokenAgeSeconds: number,
  k2kGatewayClient: K2K2GatewayApiClient,
  logger: FastifyBaseLogger,
) {
  try {
    const protectedHeader = decodeProtectedHeader(clientAssertionJWS);
    const payload = decodeJwt(clientAssertionJWS);

    logger.info(
      `Verifying Client Assertion (JTI=${payload.jti}) signature for Consumer Keychain ${consumerKeychainId} with KID ${protectedHeader.kid} and algorithm ${protectedHeader.alg}`,
    );

    const {
      header: { alg: clientAssertionAlg, kid },
      payload: { purposeId },
    } = ClientAssertion.parse({
      header: protectedHeader,
      payload,
    });

    const {
      data: { consumerAttributes, publicKey },
    } = await k2kGatewayApi.getClientAssertionVerificationData({
      body: {
        keychainId: consumerKeychainId,
        kid,
        purposeId,
      },
      client: k2kGatewayClient,
    });

    assertPublicKeyAlgEqualToClientAssertionAlg(
      publicKey.algorithm,
      clientAssertionAlg,
    );

    const verificationKey = createPublicKey({
      pemKey: decodeBase64Pem(publicKey.encodedPem),
    });

    await jwtVerify(clientAssertionJWS, verificationKey, {
      algorithms: [publicKey.algorithm],
      audience: clientAssertionAcceptedAudiences,
      clockTolerance: clientAssertionClockToleranceSeconds,
      issuer: consumerKeychainId,
      maxTokenAge: clientAssertionMaxTokenAgeSeconds,
      subject: consumerKeychainId,
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
      throw clientAssertionClaimsValidationError(consumerKeychainId, error);
    } else if (error instanceof JWSSignatureVerificationFailed) {
      throw invalidClientAssertionSignature();
    } else if (error instanceof JWSInvalid) {
      throw jsonWebTokenError(error.message);
    } else if (isAxiosError(error) || error instanceof ApiError) {
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
  const agreementStateError = match(agreement.state)
    .with("Active", () => undefined)
    .with(
      "Suspended",
      "Archived",
      "PendingConsumerOperatorIdentification",
      (state) => agreementNotActive(agreement.id, state),
    )
    .exhaustive();

  const eserviceVersionError = match(eserviceVersion.state)
    .with("Active", () => undefined)
    .with("Suspended", "Archived", (state) =>
      eserviceVersionNotActive(eserviceVersion.id, state),
    )
    .exhaustive();

  const purposeError = match(purpose.state)
    .with("Active", () => undefined)
    .with("Suspended", "Archived", (state) =>
      purposeNotActive(purpose.id, state),
    )
    .exhaustive();

  if (agreementStateError || eserviceVersionError || purposeError) {
    throw platformStatesNotActive([
      agreementStateError,
      eserviceVersionError,
      purposeError,
    ]);
  }
}

function assertPublicKeyAlgEqualToClientAssertionAlg(
  publicKeyAlg: string,
  clientAssertionAlg: Algorithm,
) {
  if (publicKeyAlg !== clientAssertionAlg) {
    throw publicKeyAlgNotMatchingClientAssertionAlg(
      publicKeyAlg,
      clientAssertionAlg,
    );
  }
}
