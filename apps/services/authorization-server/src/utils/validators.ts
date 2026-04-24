import type { Agreement } from "@knodia/agreement-models";
import type { ExternalResource } from "@knodia/common-models/externalResource";
import type {
  ConsumerKeychainId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";
import type { JtiReplayStore } from "@knodia/db-jti-replay-store";
import type { Purpose } from "@knodia/purpose-models";
import type { FastifyBaseLogger } from "fastify";

import { hasAllRequiredAttributes } from "@knodia/attribute-models";
import { type Algorithm } from "@knodia/common-models/algorithms";
import { createPublicKey, decodeBase64Pem } from "@knodia/crypto";
import { type EserviceVersion } from "@knodia/eservice-models";
import {
  ApiError,
  unauthorizedError,
} from "@knodia/fastify-zod-api-commons/models";
import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";
import { AxiosError } from "axios";
import {
  decodeJwt,
  decodeProtectedHeader,
  importJWK,
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

import { ClientAssertion } from "../models/clientAssertion.ts";
import {
  EXPECTED_CLIENT_ASSERTION_TYP,
  EXPECTED_DPOP_PROOF_TYP,
} from "../models/constants.ts";
import { DPoPProof } from "../models/dpop.ts";
import {
  accessTokenTypeMismatch,
  agreementNotActive,
  clientAssertionClaimsValidationError,
  clientAssertionExpired,
  consumerKnodeVerificationDataNotFound,
  consumerMissingRequiredAttributes,
  dpopClaimsValidationError,
  dpopProofExpired,
  eserviceVersionNotActive,
  invalidClientAssertionJWS,
  invalidClientAssertionSignature,
  invalidDpopProofJWS,
  invalidDpopProofSignature,
  platformStatesNotActive,
  publicKeyAlgNotMatchingClientAssertionAlg,
  purposeNotActive,
  unexpectedClientAssertionSignatureVerificationError,
  unexpectedConsumerKnodeVerificationDataRetrievalError,
  unexpectedDpopProofSignatureVerificationError,
} from "../models/errors.ts";
import {
  retrieveAgreement,
  retrieveEserviceVersion,
  retrievePurpose,
} from "./readmodelUtils.ts";

export async function assertDpopProofNotReplayed(
  dpopProofJWT: DPoPProof,
  dpopProofMaxTokenAgeSeconds: number,
  dpopProofStore: JtiReplayStore,
) {
  const firstUse = await dpopProofStore.consume(
    dpopProofJWT.payload.jti,
    dpopProofJWT.payload.iat,
    dpopProofJWT.payload.iat + dpopProofMaxTokenAgeSeconds,
  );
  if (!firstUse) {
    throw unauthorizedError("DPoP proof already used");
  }
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
      typ: EXPECTED_CLIENT_ASSERTION_TYP,
    });

    return {
      consumerAttributes,
      purposeId,
    };
  } catch (error) {
    throw match(error)
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
      .with(P.instanceOf(AxiosError), (e) => {
        if (e.status === 404) {
          return consumerKnodeVerificationDataNotFound();
        } else {
          return unexpectedConsumerKnodeVerificationDataRetrievalError(e);
        }
      })
      .otherwise((e) => unexpectedClientAssertionSignatureVerificationError(e));
  }
}

export async function verifyDpopProofSignature(
  dpopProofJWS: string | undefined,
  dpopProofMaxTokenAgeSeconds: number,
  expectedDpopProofHtu: string,
  logger: FastifyBaseLogger,
): Promise<DPoPProof | undefined> {
  if (!dpopProofJWS) {
    return undefined;
  }

  try {
    const protectedHeader = decodeProtectedHeader(dpopProofJWS);
    const payload = decodeJwt(dpopProofJWS);

    logger.info(
      `Verifying DPoP Proof (JTI=${payload.jti}) signature with algorithm ${protectedHeader.alg}`,
    );

    const dpopProof = DPoPProof.parse({
      header: protectedHeader,
      payload,
    });
    const {
      header: { alg: dpopProofAlg, jwk },
      payload: { htu },
    } = dpopProof;

    assertDpopProofHtuIsValid(htu, expectedDpopProofHtu);

    const verificationKey = await importJWK(jwk, dpopProofAlg);

    await jwtVerify(dpopProofJWS, verificationKey, {
      algorithms: [dpopProofAlg],
      maxTokenAge: dpopProofMaxTokenAgeSeconds,
      typ: EXPECTED_DPOP_PROOF_TYP,
    });

    return dpopProof;
  } catch (error) {
    throw match(error)
      .with(P.instanceOf(JWTExpired), () => dpopProofExpired())
      .with(
        P.union(P.instanceOf(JWTClaimValidationFailed), P.instanceOf(ZodError)),
        (e) => dpopClaimsValidationError(e),
      )
      .with(P.instanceOf(JWSSignatureVerificationFailed), () =>
        invalidDpopProofSignature(),
      )
      .with(P.instanceOf(JWSInvalid), (e) => invalidDpopProofJWS(e.message))
      .with(P.instanceOf(ApiError), (e) => e)
      .otherwise((e) => unexpectedDpopProofSignatureVerificationError(e));
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

function assertDpopProofHtuIsValid(htu: string, expectedDpopProofHtu: string) {
  if (htu !== expectedDpopProofHtu) {
    throw dpopClaimsValidationError(
      new Error(
        `Invalid 'htu' claim in DPoP proof. Expected '${expectedDpopProofHtu}' but got '${htu}'`,
      ),
    );
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
