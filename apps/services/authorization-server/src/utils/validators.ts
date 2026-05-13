import type { Agreement } from "@knodia/agreement-models";
import type { ExternalResource } from "@knodia/common-models/externalResource";
import type {
  ConsumerKeychainId,
  KnodeApiKeychainId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
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
import { k2kGatewayApi } from "@knodia/k2k-gateway-client";
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
import { type z, ZodError } from "zod";

import type { AuthorizationServerConfig } from "../config/config.ts";
import type { ReadmodelService } from "../services/readmodelService.ts";

import { getK2K2GatewayApiClient } from "../clients/clientsProvider.ts";
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
  retrieveKnodeApiKeychainKey,
  retrievePurpose,
} from "./readmodelUtils.ts";

interface PublicKeyForVerification {
  algorithm: string;
  encodedPem: string;
}

export async function validatePlatformObjects(
  purpose: Purpose,
  consumerAttributes: k2kGatewayApi.Attribute[],
  dpopProofJWT: JWTPayload | undefined,
  readmodelService: ReadmodelService,
) {
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
  config: AuthorizationServerConfig,
  readmodelService: ReadmodelService,
  logger: FastifyBaseLogger,
): Promise<{
  consumerAttributes: k2kGatewayApi.Attribute[];
  purpose: WithMetadata<Purpose>;
}> {
  try {
    const {
      headers: { alg: clientAssertionAlg, kid },
      payload: { jti, purposeId },
    } = decodeAndParseAssertion(clientAssertionJWS, ClientAssertion);

    logger.info(
      `Verifying Client Assertion (JTI=${jti}) signature for Consumer Keychain ${consumerKeychainId} with KID ${kid} and algorithm ${clientAssertionAlg}`,
    );

    const purpose = await retrievePurpose(purposeId, readmodelService);

    const {
      data: { consumerAttributes, publicKey },
    } = await k2kGatewayApi.getConsumerClientAssertionVerificationData({
      body: {
        keychainId: consumerKeychainId,
        kid,
        purposeId,
      },
      client: getK2K2GatewayApiClient(
        config.targetKnodeUrls,
        purpose.data.consumer.knodeId,
      ),
    });

    await verifyClientAssertionJwtSignature({
      clientAssertionAlg,
      clientAssertionJWS,
      config,
      publicKey,
      subject: consumerKeychainId,
    });

    return {
      consumerAttributes,
      purpose,
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
  config: AuthorizationServerConfig,
  readmodelService: ReadmodelService,
  logger: FastifyBaseLogger,
) {
  try {
    const {
      headers: { alg: clientAssertionAlg, kid },
      payload: { jti, knodeId },
    } = decodeAndParseAssertion(clientAssertionJWS, KnodeApiClientAssertion);

    logger.info(
      `Verifying Knode API Client Assertion (JTI=${jti}) signature for Knode API Keychain ${knodeApiKeychainId} with KID ${kid} and algorithm ${clientAssertionAlg}`,
    );

    const { ownerId, publicKey } =
      knodeId === config.knodeId
        ? await resolveKnodeApiKeychainKeyFromReadmodel(
            knodeApiKeychainId,
            kid,
            readmodelService,
          )
        : await resolveKnodeApiKeychainKeyViaK2K(
            knodeApiKeychainId,
            kid,
            knodeId,
            config.targetKnodeUrls,
          );

    await verifyClientAssertionJwtSignature({
      clientAssertionAlg,
      clientAssertionJWS,
      config,
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

function decodeAndParseAssertion<T extends z.ZodTypeAny>(
  clientAssertionJWS: string,
  codec: T,
): z.infer<T> {
  return codec.parse({
    headers: decodeProtectedHeader(clientAssertionJWS),
    payload: decodeJwt(clientAssertionJWS),
  });
}

async function resolveKnodeApiKeychainKeyFromReadmodel(
  knodeApiKeychainId: KnodeApiKeychainId,
  kid: string,
  readmodelService: ReadmodelService,
): Promise<{ ownerId: OrganizationId; publicKey: PublicKeyForVerification }> {
  const { key, knodeApiKeychain } = await retrieveKnodeApiKeychainKey(
    knodeApiKeychainId,
    kid,
    readmodelService,
  );
  return {
    ownerId: knodeApiKeychain.data.ownerId,
    publicKey: { algorithm: key.algorithm, encodedPem: key.encodedPem },
  };
}

async function resolveKnodeApiKeychainKeyViaK2K(
  knodeApiKeychainId: KnodeApiKeychainId,
  kid: string,
  targetKnodeId: KnodeId,
  targetKnodeUrls: TargetKnodeUrls,
): Promise<{ ownerId: OrganizationId; publicKey: PublicKeyForVerification }> {
  const {
    data: { ownerId, publicKey },
  } = await k2kGatewayApi.getKnodeApiClientAssertionVerificationData({
    body: { keychainId: knodeApiKeychainId, kid },
    client: getK2K2GatewayApiClient(targetKnodeUrls, targetKnodeId),
  });
  return {
    ownerId: ownerId as OrganizationId,
    publicKey: {
      algorithm: publicKey.algorithm,
      encodedPem: publicKey.encodedPem,
    },
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
    .with(P.instanceOf(JWSInvalid), (e) => invalidClientAssertionJWS(e.message))
    .with(P.instanceOf(ApiError), (e) => e)
    .with(P.instanceOf(AxiosError), (e) =>
      e.status === 404 ? onNotFound() : onUnexpectedAxios(e),
    )
    .otherwise((e) => unexpectedClientAssertionSignatureVerificationError(e));
}

async function verifyClientAssertionJwtSignature({
  clientAssertionAlg,
  clientAssertionJWS,
  config: {
    clientAssertionAcceptedAudiences,
    clientAssertionMaxTokenAgeSeconds,
    jwtClockToleranceSeconds,
  },
  publicKey,
  subject,
}: {
  clientAssertionAlg: Algorithm;
  clientAssertionJWS: string;
  config: AuthorizationServerConfig;
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
    audience: clientAssertionAcceptedAudiences,
    clockTolerance: jwtClockToleranceSeconds,
    issuer: subject,
    maxTokenAge: clientAssertionMaxTokenAgeSeconds,
    subject,
    typ: EXPECTED_CLIENT_ASSERTION_TYP,
  });
}
