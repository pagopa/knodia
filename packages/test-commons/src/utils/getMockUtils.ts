import { Agreement, type AgreementState } from "@knodia/agreement-models";
import { unsafeBrandKeyId } from "@knodia/common-models/ids";
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
import { zocker } from "zocker";

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
  confirmPrincipleIntegrityAndDiscretion: "true",
  declarationConfirmGDPR: "true",
  legalBasis: ["CONSENT"],
  personalDataTypes: ["WITH_IDENTIFYING_DATA"],
  purpose: "INSTITUTIONAL",
  purposeDescription: "Test purpose for local development",
  usesThirdPartyPersonalData: "NO",
};

export function getMockConsumerKeychainPurpose(
  seed = 0,
): ConsumerKeychainPurpose {
  return zocker(ConsumerKeychainPurpose).setSeed(seed).generate();
}

export function getMockPurpose(seed = 0): Purpose {
  return {
    ...zocker(Purpose).setSeed(seed).generate(),
    // zocker generates non-JSON-serializable values for Record<string, unknown>;
    // override with a realistic JSON-safe object
    formAnswersJson: MOCK_PURPOSE_FORM_ANSWERS,
  };
}
