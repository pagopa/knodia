import { Agreement, type AgreementState } from "@knodia/agreement-models";
import { Algorithm } from "@knodia/common-models/algorithms";
import {
  PublicKeyJwkES256,
  PublicKeyJwkRS256,
} from "@knodia/common-models/crypto";
import {
  type ConsumerKeychainId,
  generateId,
  generateUserId,
  type PurposeId,
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
  type ConsumerKeychainKey,
  ConsumerKeychainPurpose,
} from "@knodia/keychain-models";
import { Organization } from "@knodia/organization-models";
import { Purpose } from "@knodia/purpose-models";
import { type JWTHeaderParameters, type JWTPayload } from "jose";
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
    keys: [getMockConsumerKeychainKey(seed)],
  });
}

export function getMockConsumerKeychainKey(seed = 0): ConsumerKeychainKey {
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
  standardClaimsOverride?: Partial<JWTPayload>;
}): Promise<{
  clientAssertion: {
    headers: JWTHeaderParameters;
    payload: JWTPayload;
  };
  clientAssertionJWS: string;
  keySet: ReturnType<typeof generateKeySet>["keySet"];
  publicKeyEncodedPem: string;
}> {
  const { keySet, publicKeyEncodedPem } = generateKeySet();

  const threeHourLater = new Date();
  threeHourLater.setHours(threeHourLater.getHours() + 3);

  const consumerKeychainId = generateId<ConsumerKeychainId>();
  const defaultPayload: JWTPayload & { purpose_id: PurposeId } = {
    aud: ["test.knodia.com"],
    exp: dateToSeconds(threeHourLater),
    iat: dateToSeconds(new Date()),
    iss: consumerKeychainId,
    jti: generateId(),
    purpose_id: generateId(),
    sub: consumerKeychainId,
  };

  const actualPayload: JWTPayload = {
    ...defaultPayload,
    ...props?.standardClaimsOverride,
    ...props?.customClaims,
  };

  const headers: JWTHeaderParameters = {
    alg: Algorithm.enum.RS256,
    kid: "kid",
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
  props,
}: {
  alg?: Algorithm;
  props?: {
    customHeader?: Record<string, unknown>;
    customPayload?: Record<string, unknown>;
  };
} = {}): Promise<{
  dpopProofJWS: string;
  dpopProofJWT: {
    headers: JWTHeaderParameters;
    payload: JWTPayload;
  };
}> {
  const { keySet, publicKeyJwk } = generateKeySet(alg);

  const payload: JWTPayload = {
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

  const headers: JWTHeaderParameters = {
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
