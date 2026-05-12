import { Agreement, type AgreementState } from "@knodia/agreement-models";
import {
  type ClientAssertionHeader,
  type ClientAssertionRawPayload,
} from "@knodia/authorization-models/clientAssertion";
import {
  type KnodeApiClientAssertionHeader,
  type KnodeApiClientAssertionRawPayload,
} from "@knodia/authorization-models/clientAssertion/knodeApi";
import {
  type DpopProof,
  type DpopProofHeader,
  type DpopProofPayload,
} from "@knodia/authorization-models/dpop";
import {
  Algorithm,
  PublicKeyJwkES256,
  PublicKeyJwkRS256,
} from "@knodia/common-models/crypto";
import { generateExternalId } from "@knodia/common-models/externalResource";
import {
  type ConsumerKeychainId,
  type EserviceTemplateId,
  generateId,
  generateUserId,
  type KeyId,
  type KnodeApiKeychainId,
  unsafeBrandKeyId,
} from "@knodia/common-models/ids";
import { dateToSeconds } from "@knodia/common-models/utils";
import {
  Eservice,
  EserviceCategory,
  EserviceVersion,
  type EserviceVersionState,
} from "@knodia/eservice-models";
import {
  ConsumerKeychain,
  ConsumerKeychainPurpose,
  type KeychainKey,
  KnodeApiKeychain,
} from "@knodia/keychain-models";
import { Organization } from "@knodia/organization-models";
import { Purpose } from "@knodia/purpose-models";
import { createHash } from "crypto";
import { match } from "ts-pattern";
import { zocker } from "zocker";

import { generateKeySet, signJWT } from "./cryptoUtils.js";

export function getMockAgreement({
  seed = 0,
  state = "Active",
}: {
  seed?: number;
  state?: AgreementState;
} = {}): Agreement {
  return {
    ...zocker(Agreement)
      .array({
        min: 1,
      })
      .setSeed(seed)
      .generate(),
    state,
  };
}

export function getMockConsumerKeychain(seed = 0): ConsumerKeychain {
  // Re-parse through the schema to normalize zocker's mixed-case GUIDs
  // (zocker ignores Zod transforms like toLowerCase on guid-based UserId)
  return ConsumerKeychain.parse({
    ...zocker(ConsumerKeychain)
      .array({
        min: 1,
      })
      .setSeed(seed)
      .generate(),
    keys: [getMockKeychainKey(seed)],
  });
}

export function getMockEservice({
  latestVersionState,
  minArrayLength = 1,
  seed = 0,
}: {
  latestVersionState?: EserviceVersionState;
  minArrayLength?: number;
  seed?: number;
} = {}): Eservice {
  return {
    ...zocker(Eservice)
      .array({
        min: minArrayLength,
      })
      .setSeed(seed)
      .generate(),
    template: {
      id: generateExternalId<EserviceTemplateId>(),
      knodeId: "Lynx",
    },
    ...(latestVersionState !== undefined
      ? {
          versions: [
            zocker(EserviceVersion)
              .array({
                min: minArrayLength,
              })
              .supply(EserviceVersion.shape.state, latestVersionState)
              .setSeed(seed)
              .generate(),
          ],
        }
      : {}),
  };
}

export function getMockEserviceCategory(seed = 0) {
  return zocker(EserviceCategory).setSeed(seed).generate();
}

export function getMockEserviceVersion(seed = 0): EserviceVersion {
  return zocker(EserviceVersion).setSeed(seed).generate();
}

export function getMockKeychainKey(seed = 0): KeychainKey {
  const baseKey = zocker(ConsumerKeychain.shape.keys.element)
    .setSeed(seed)
    .generate();

  return {
    ...baseKey,
    encodedPem: `-----BEGIN PUBLIC KEY-----mock-key-${seed}-----END PUBLIC KEY-----`,
    kid: unsafeBrandKeyId(
      Buffer.from(`mock-key-${seed}`, "utf-8").toString("base64url"),
    ),
    userId: generateUserId(),
  };
}

export function getMockKnodeApiKeychain(seed = 0): KnodeApiKeychain {
  // Re-parse through the schema to normalize zocker's mixed-case GUIDs
  // (zocker ignores Zod transforms like toLowerCase on guid-based UserId)
  return KnodeApiKeychain.parse({
    ...zocker(KnodeApiKeychain)
      .array({
        min: 1,
      })
      .setSeed(seed)
      .generate(),
    keys: [getMockKeychainKey(seed)],
  });
}

export function getMockOrganization(seed = 0): Organization {
  return zocker(Organization).setSeed(seed).generate();
}

export const MOCK_PURPOSE_FORM_ANSWERS = {
  checkedExistenceMereCorrectnessInteropCatalogue: "true",
  confirmPrincipleIntegrityAndDiscretion: "true",
  dataDownload: "NO",
  declarationConfirmGDPR: "true",
  deliveryMethod: "CLEARTEXT",
  doneDpia: "NO",
  institutionalPurpose: "Test purpose for local development",
  isRequestOnBehalfOfThirdParties: "NO",
  knowsDataQuantity: "NO",
  legalBasis: ["CONSENT"],
  personalDataTypes: ["WITH_IDENTIFYING_DATA"],
  policyProvided: "YES",
  policyProvidedMedium: "PRINT",
  purpose: "INSTITUTIONAL",
  purposePursuit: "MERE_CORRECTNESS",
  usesPersonalData: "YES",
};

export async function getMockClientAssertion(props?: {
  customClaims?: Record<string, unknown>;
  customHeader?: Record<string, unknown>;
  standardClaimsOverride?: Partial<ClientAssertionRawPayload>;
}): Promise<{
  clientAssertion: {
    headers: ClientAssertionHeader;
    payload: ClientAssertionRawPayload;
  };
  clientAssertionJWS: string;
  keySet: ReturnType<typeof generateKeySet>["keySet"];
  publicKeyEncodedPem: string;
}> {
  const { keySet, publicKeyEncodedPem } = generateKeySet();

  const threeHourLater = new Date();
  threeHourLater.setHours(threeHourLater.getHours() + 3);

  const consumerKeychainId = generateId<ConsumerKeychainId>();
  const defaultPayload: ClientAssertionRawPayload = {
    aud: ["test.knodia.com"],
    exp: dateToSeconds(threeHourLater),
    iat: dateToSeconds(new Date()),
    iss: consumerKeychainId,
    jti: generateId(),
    purpose_id: generateId(),
    sub: consumerKeychainId,
  };

  const actualPayload: ClientAssertionRawPayload = {
    ...defaultPayload,
    ...props?.standardClaimsOverride,
    ...props?.customClaims,
  };

  const headers: ClientAssertionHeader = {
    alg: Algorithm.enum.RS256,
    kid: "kid" as KeyId,
    typ: "JWT",
    ...props?.customHeader,
  };

  const clientAssertionJWS = await signJWT({
    jwt: { headers, payload: actualPayload },
    keySet,
  });

  return {
    clientAssertion: {
      headers,
      payload: actualPayload,
    },
    clientAssertionJWS,
    keySet,
    publicKeyEncodedPem,
  };
}

export async function getMockKnodeApiClientAssertion(props?: {
  customClaims?: Record<string, unknown>;
  customHeader?: Record<string, unknown>;
  standardClaimsOverride?: Partial<KnodeApiClientAssertionRawPayload>;
}): Promise<{
  clientAssertion: {
    headers: KnodeApiClientAssertionHeader;
    payload: KnodeApiClientAssertionRawPayload;
  };
  clientAssertionJWS: string;
  keySet: ReturnType<typeof generateKeySet>["keySet"];
  publicKeyEncodedPem: string;
}> {
  const { keySet, publicKeyEncodedPem } = generateKeySet();

  const threeHourLater = new Date();
  threeHourLater.setHours(threeHourLater.getHours() + 3);

  const knodeApiKeychainId = generateId<KnodeApiKeychainId>();
  const defaultPayload: KnodeApiClientAssertionRawPayload = {
    aud: ["test.knodia.com"],
    exp: dateToSeconds(threeHourLater),
    iat: dateToSeconds(new Date()),
    iss: knodeApiKeychainId,
    jti: generateId(),
    knode_id: "Orion",
    sub: knodeApiKeychainId,
  };

  const actualPayload: KnodeApiClientAssertionRawPayload = {
    ...defaultPayload,
    ...props?.standardClaimsOverride,
    ...props?.customClaims,
  };

  const headers: KnodeApiClientAssertionHeader = {
    alg: Algorithm.enum.RS256,
    kid: "kid" as KeyId,
    typ: "JWT",
    ...props?.customHeader,
  };

  const clientAssertionJWS = await signJWT({
    jwt: { headers, payload: actualPayload },
    keySet,
  });

  return {
    clientAssertion: {
      headers,
      payload: actualPayload,
    },
    clientAssertionJWS,
    keySet,
    publicKeyEncodedPem,
  };
}

export function getMockConsumerKeychainPurpose(
  seed = 0,
): ConsumerKeychainPurpose {
  return zocker(ConsumerKeychainPurpose).setSeed(seed).generate();
}

export async function getMockDpopProof({
  alg = Algorithm.enum.ES256,
  customKeySet,
  dpopBoundToken,
  props,
}: {
  alg?: Algorithm;
  customKeySet?: ReturnType<typeof generateKeySet>["keySet"];
  dpopBoundToken?: string;
  props?: {
    customHeader?: Partial<DpopProofHeader> & Record<string, unknown>;
    customPayload?: Partial<DpopProofPayload> & Record<string, unknown>;
  };
} = {}): Promise<{
  dpopProofJWS: string;
  dpopProofJWT: DpopProof;
  keySet: ReturnType<typeof generateKeySet>["keySet"];
}> {
  const { keySet, publicKeyJwk } = customKeySet
    ? {
        keySet: customKeySet,
        publicKeyJwk: customKeySet.publicKey.export({ format: "jwk" }),
      }
    : generateKeySet(alg);

  const payload: DpopProofPayload = {
    ath: dpopBoundToken
      ? createHash("sha256").update(dpopBoundToken).digest("base64url")
      : undefined,
    htm: "POST",
    htu: "https://test.knodia.org/token",
    iat: dateToSeconds(new Date()),
    jti: generateId(),
    ...props?.customPayload,
  };

  const jwk = match(alg)
    .with(Algorithm.enum.ES256, () => PublicKeyJwkES256.parse(publicKeyJwk))
    .with(Algorithm.enum.RS256, () => PublicKeyJwkRS256.parse(publicKeyJwk))
    .exhaustive();

  const headers: DpopProofHeader = {
    alg,
    jwk,
    typ: "dpop+jwt",
    ...props?.customHeader,
  };

  const dpopJWS = await signJWT({
    jwt: { headers, payload },
    keySet,
  });

  return {
    dpopProofJWS: dpopJWS,
    dpopProofJWT: {
      headers,
      payload,
    },
    keySet,
  };
}

export function getMockPurpose(seed = 0): Purpose {
  return {
    ...zocker(Purpose).setSeed(seed).generate(),
    // zocker generates non-JSON-serializable values for Record<string, unknown>;
    // override with a realistic JSON-safe object
    formAnswersJson: MOCK_PURPOSE_FORM_ANSWERS,
  };
}
