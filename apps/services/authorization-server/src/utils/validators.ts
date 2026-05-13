import type { Agreement } from "@knodia/agreement-models";
import type { ExternalResource } from "@knodia/common-models/externalResource";
import type {
  ConsumerKeychainId,
  KnodeApiKeychainId,
  KnodeId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";
import type { Purpose } from "@knodia/purpose-models";
import type { FastifyBaseLogger } from "fastify";

import { hasAllRequiredAttributes } from "@knodia/attribute-models";
import {
  ClientAssertion,
  EXPECTED_CLIENT_ASSERTION_TYP,
} from "@knodia/authorization-models/clientAssertion";
import { KnodeApiClientAssertion } from "@knodia/authorization-models/clientAssertion/knodeApi";
import { type Algorithm } from "@knodia/common-models/crypto";
import { type TargetKnodeUrls } from "@knodia/common-models/targetKnodeUrls";
import { createPublicKey, decodeBase64Pem } from "@knodia/crypto";
import { type EserviceVersion } from "@knodia/eservice-models";
import { ApiError } from "@knodia/fastify-zod-api-commons/models";
import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";
import { AxiosError } from "axios";
import {
  decodeJwt,
  decodeProtectedHeader,
  type JWTPayload,
  jwtVerify,
} from "jose";
import {
  JWSInvalid,
  JWSSignatureVerificationFailed,
  JWTClaimValidationFailed,
  JWTExpired,
} from "jose/errors";
import { match, P } from "ts-pattern";
import { ZodError } from "zod";

import type { ReadmodelService } from "../services/readmodelService.ts";

import { getK2K2GatewayApiClientForTarget } from "../clients/clientsProvider.ts";
import {
  accessTokenTypeMismatch,
  agreementNotActive,
  clientAssertionClaimsValidationError,
  clientAssertionExpired,
  consumerKnodeVerificationDataNotFound,
  consumerMissingRequiredAttributes,
  eserviceVersionNotActive,
  invalidClientAssertionJWS,
  invalidClientAssertionSignature,
  knodeApiKeychainKnodeVerificationDataNotFound,
  knodeApiKeychainKeyNotFound,
  knodeApiKeychainNotFound,
  platformStatesNotActive,
  publicKeyAlgNotMatchingClientAssertionAlg,
  purposeNotActive,
  unexpectedClientAssertionSignatureVerificationError,
  unexpectedConsumerKnodeVerificationDataRetrievalError,
  unexpectedKnodeApiKeychainKnodeVerificationDataRetrievalError,
} from "../models/errors.ts";
import {
  retrieveAgreement,
  retrieveEserviceVersion,
  retrievePurpose,
} from "./readmodelUtils.ts";

interface PublicKeyForVerification {
  algorithm: string;
  encodedPem: string;
}

export async function validatePlatformObjects(
  purposeId: PurposeId,
  consumerAttributes: k2kGatewayApi.Attribute[],
  dpopProofJWT: JWTPayload | undefined,
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

  assertEserviceVersionUsesCorrectToken(eserviceVersion, dpopProofJWT);
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
  jwtClockToleranceSeconds: number,
  clientAssertionMaxTokenAgeSeconds: number,
  k2kGatewayClient: K2K2GatewayApiClient,
  logger: FastifyBaseLogger,
) {
  try {
    const { clientAssertionAlg, kid, purposeId } =
      decodeAndParseClientAssertion(
        clientAssertionJWS,
        `Consumer Keychain ${consumerKeychainId}`,
        logger,
      );

    const {
      data: { consumerAttributes, publicKey },
    } = await k2kGatewayApi.getConsumerClientAssertionVerificationData({
      body: {
        keychainId: consumerKeychainId,
        kid,
        purposeId,
      },
      client: k2kGatewayClient,
    });

    await verifyClientAssertionJwtSignature({
      acceptedAudiences: clientAssertionAcceptedAudiences,
      clientAssertionAlg,
      clientAssertionJWS,
      jwtClockToleranceSeconds,
      maxTokenAgeSeconds: clientAssertionMaxTokenAgeSeconds,
      publicKey,
      subject: consumerKeychainId,
    });

    return {
      consumerAttributes,
      purposeId,
    };
  } catch (error) {
    throw translateClientAssertionVerificationError(error, {
      onNotFound: consumerKnodeVerificationDataNotFound,
      onUnexpectedAxios: unexpectedConsumerKnodeVerificationDataRetrievalError,
    });
  }
}

export async function verifyKnodeApiClientAssertionSignature(
  {
    clientAssertionJWS,
    knodeApiKeychainId,
  }: {
    clientAssertionJWS: string;
    knodeApiKeychainId: KnodeApiKeychainId;
  },
  {
    clientAssertionAcceptedAudiences,
    clientAssertionMaxTokenAgeSeconds,
    jwtClockToleranceSeconds,
    localKnodeId,
    readmodelService,
    targetKnodeUrls,
  }: {
    clientAssertionAcceptedAudiences: string[];
    clientAssertionMaxTokenAgeSeconds: number;
    jwtClockToleranceSeconds: number;
    localKnodeId: KnodeId;
    readmodelService: ReadmodelService;
    targetKnodeUrls: TargetKnodeUrls;
  },
  logger: FastifyBaseLogger,
) {
  try {
    const { clientAssertionAlg, kid, knodeId } =
      decodeAndParseKnodeApiClientAssertion(
        clientAssertionJWS,
        `Knode API Keychain ${knodeApiKeychainId}`,
        logger,
      );

    const { ownerId, publicKey } =
      knodeId === localKnodeId
        ? await resolveLocalKnodeApiKeychainKey(
            knodeApiKeychainId,
            kid,
            readmodelService,
          )
        : await resolveRemoteKnodeApiKeychainKey(
            knodeApiKeychainId,
            kid,
            knodeId,
            targetKnodeUrls,
          );

    await verifyClientAssertionJwtSignature({
      acceptedAudiences: clientAssertionAcceptedAudiences,
      clientAssertionAlg,
      clientAssertionJWS,
      jwtClockToleranceSeconds,
      maxTokenAgeSeconds: clientAssertionMaxTokenAgeSeconds,
      publicKey,
      subject: knodeApiKeychainId,
    });

    return { keychainKnodeId: knodeId, ownerId };
  } catch (error) {
    throw translateClientAssertionVerificationError(error, {
      onNotFound: knodeApiKeychainKnodeVerificationDataNotFound,
      onUnexpectedAxios:
        unexpectedKnodeApiKeychainKnodeVerificationDataRetrievalError,
    });
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

function assertEserviceVersionUsesCorrectToken(
  eserviceVersion: Pick<EserviceVersion, "accessTokenType" | "id">,
  dpopProofJWT: JWTPayload | undefined,
) {
  match(eserviceVersion.accessTokenType)
    .with("Bearer", () => {
      if (dpopProofJWT) {
        throw accessTokenTypeMismatch(eserviceVersion, true);
      }
    })
    .with("DPoP", () => {
      if (!dpopProofJWT) {
        throw accessTokenTypeMismatch(eserviceVersion, false);
      }
    })
    .exhaustive();
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

function decodeAndParseClientAssertion(
  clientAssertionJWS: string,
  subjectLabel: string,
  logger: FastifyBaseLogger,
) {
  const protectedHeader = decodeProtectedHeader(clientAssertionJWS);
  const payload = decodeJwt(clientAssertionJWS);

  logger.info(
    `Verifying Client Assertion (JTI=${payload.jti}) signature for ${subjectLabel} with KID ${protectedHeader.kid} and algorithm ${protectedHeader.alg}`,
  );

  const {
    headers: { alg: clientAssertionAlg, kid },
    payload: { purposeId },
  } = ClientAssertion.parse({ headers: protectedHeader, payload });

  return { clientAssertionAlg, kid, purposeId };
}

function decodeAndParseKnodeApiClientAssertion(
  clientAssertionJWS: string,
  subjectLabel: string,
  logger: FastifyBaseLogger,
) {
  const protectedHeader = decodeProtectedHeader(clientAssertionJWS);
  const payload = decodeJwt(clientAssertionJWS);

  logger.info(
    `Verifying Knode API Client Assertion (JTI=${payload.jti}) signature for ${subjectLabel} with KID ${protectedHeader.kid} and algorithm ${protectedHeader.alg}`,
  );

  const {
    headers: { alg: clientAssertionAlg, kid },
    payload: { knodeId },
  } = KnodeApiClientAssertion.parse({ headers: protectedHeader, payload });

  return { clientAssertionAlg, kid, knodeId };
}

async function resolveLocalKnodeApiKeychainKey(
  knodeApiKeychainId: KnodeApiKeychainId,
  kid: string,
  readmodelService: ReadmodelService,
): Promise<{ ownerId: OrganizationId; publicKey: PublicKeyForVerification }> {
  const keychain = await readmodelService.getKnodeApiKeychain(
    knodeApiKeychainId,
  );
  if (!keychain) {
    throw knodeApiKeychainNotFound(knodeApiKeychainId);
  }
  const key = keychain.data.keys.find((k) => k.kid === kid);
  if (!key) {
    throw knodeApiKeychainKeyNotFound(knodeApiKeychainId, kid);
  }
  return {
    ownerId: keychain.data.ownerId,
    publicKey: { algorithm: key.algorithm, encodedPem: key.encodedPem },
  };
}

async function resolveRemoteKnodeApiKeychainKey(
  knodeApiKeychainId: KnodeApiKeychainId,
  kid: string,
  targetKnodeId: KnodeId,
  targetKnodeUrls: TargetKnodeUrls,
): Promise<{ ownerId: OrganizationId; publicKey: PublicKeyForVerification }> {
  const {
    data: { ownerId, publicKey },
  } = await k2kGatewayApi.getKnodeApiClientAssertionVerificationData({
    body: { keychainId: knodeApiKeychainId, kid },
    client: getK2K2GatewayApiClientForTarget(targetKnodeUrls, targetKnodeId),
  });
  return {
    ownerId: ownerId as OrganizationId,
    publicKey: { algorithm: publicKey.algorithm, encodedPem: publicKey.encodedPem },
  };
}

function translateClientAssertionVerificationError(
  error: unknown,
  {
    onNotFound,
    onUnexpectedAxios,
  }: {
    onNotFound: () => ApiError<string>;
    onUnexpectedAxios: (error: AxiosError) => ApiError<string>;
  },
) {
  return match(error)
    .with(P.instanceOf(JWTExpired), () => clientAssertionExpired())
    .with(
      P.union(P.instanceOf(JWTClaimValidationFailed), P.instanceOf(ZodError)),
      (e) => clientAssertionClaimsValidationError(e),
    )
    .with(P.instanceOf(JWSSignatureVerificationFailed), () =>
      invalidClientAssertionSignature(),
    )
    .with(P.instanceOf(JWSInvalid), (e) =>
      invalidClientAssertionJWS(e.message),
    )
    .with(P.instanceOf(ApiError), (e) => e)
    .with(P.instanceOf(AxiosError), (e) =>
      e.status === 404 ? onNotFound() : onUnexpectedAxios(e),
    )
    .otherwise((e) => unexpectedClientAssertionSignatureVerificationError(e));
}

async function verifyClientAssertionJwtSignature({
  acceptedAudiences,
  clientAssertionAlg,
  clientAssertionJWS,
  jwtClockToleranceSeconds,
  maxTokenAgeSeconds,
  publicKey,
  subject,
}: {
  acceptedAudiences: string[];
  clientAssertionAlg: Algorithm;
  clientAssertionJWS: string;
  jwtClockToleranceSeconds: number;
  maxTokenAgeSeconds: number;
  publicKey: PublicKeyForVerification;
  subject: string;
}): Promise<void> {
  assertPublicKeyAlgEqualToClientAssertionAlg(
    publicKey.algorithm,
    clientAssertionAlg,
  );

  const verificationKey = createPublicKey({
    pemKey: decodeBase64Pem(publicKey.encodedPem),
  });

  await jwtVerify(clientAssertionJWS, verificationKey, {
    algorithms: [publicKey.algorithm],
    audience: acceptedAudiences,
    clockTolerance: jwtClockToleranceSeconds,
    issuer: subject,
    maxTokenAge: maxTokenAgeSeconds,
    subject,
    typ: EXPECTED_CLIENT_ASSERTION_TYP,
  });
}
