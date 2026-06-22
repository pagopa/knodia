import type {
  ExternalUISessionScope,
  ExternalUISessionTokenClaims,
  InternalTokenClaims,
  KnodeApiAccessTokenClaims,
  UISessionTokenClaims,
  UISignupSessionTokenClaims,
  UserRole,
} from "@knodia/common-models/auth";
import type { NonEmptyArray } from "@knodia/common-models/types";

import {
  type ExternalId,
  unsafeBrandExternalId,
} from "@knodia/common-models/externalResource";
import {
  type AgreementId,
  type EserviceId,
  type EserviceVersionId,
  type KnodeApiKeychainId,
  KnodeId,
  type OrganizationId,
  unsafeBrandId,
  unsafeBrandUserId,
  type UserId,
} from "@knodia/common-models/ids";
import { UnsecuredJWT } from "jose";
import { match } from "ts-pattern";

export const TEST_USER_ID = unsafeBrandUserId(
  "10000000-1000-1000-8000-000000000001",
);
export const TEST_ORGANIZATION_ID = unsafeBrandId<OrganizationId>(
  "20000000-2000-1000-8000-000000000002",
);
const TEST_AGREEMENT_ID = unsafeBrandId<AgreementId>(
  "30000000-3000-1000-8000-000000000003",
);
const TEST_CONSUMER_ID = unsafeBrandExternalId<OrganizationId>(
  "40000000-4000-1000-8000-000000000004",
);
const TEST_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "50000000-5000-1000-8000-000000000005",
);
const TEST_PRODUCER_ID = unsafeBrandId<OrganizationId>(
  "60000000-6000-1000-8000-000000000006",
);
const TEST_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "70000000-7000-1000-8000-000000000007",
);
const TEST_KNODE_API_KEYCHAIN_ID = unsafeBrandId<KnodeApiKeychainId>(
  "80000000-8000-1000-8000-000000000008",
);

export type TestToken =
  | {
      agreementId?: AgreementId;
      agreementKnodeId?: KnodeId;
      consumerId?: ExternalId<OrganizationId>;
      consumerKnodeId?: KnodeId;
      eserviceId?: EserviceId;
      eserviceKnodeId?: KnodeId;
      eserviceVersionId?: EserviceVersionId;
      producerId?: OrganizationId;
      producerKnodeId?: KnodeId;
      scope?: ExternalUISessionScope;
      type: "external-ui-session";
    }
  | {
      dateOfBirth?: string;
      familyName?: string;
      fiscalNumber?: null | string;
      name?: string;
      oneIdNonce: string;
      personIdentifier?: null | string;
      spidCode?: null | string;
      type: "ui-signup-session";
      uniqueIdentifier?: string;
    }
  | {
      keychainId?: KnodeApiKeychainId;
      keychainKnodeId?: KnodeId;
      organizationId?: OrganizationId;
      organizationKnodeId?: KnodeId;
      type: "knode-api";
    }
  | {
      organizationId?: OrganizationId;
      roles?: NonEmptyArray<UserRole>;
      type: "ui-session";
      userId?: UserId;
      username?: string;
    }
  | { type: "internal" };

/**
 * Creates an unsecured JWT (`alg: "none"`) from test claims.
 * The auth mock decodes it with `decodeJwt` (no signature verification).
 */
export function createTestTokenPayload(spec: TestToken): string {
  const claims = match(spec)
    .with(
      { type: "ui-session" },
      ({ organizationId, roles, userId, username }) =>
        getTestUISessionTokenClaims({
          organizationId,
          roles,
          userId,
          username,
        }),
    )
    .with({ type: "internal" }, getTestInternalTokenClaims)
    .with({ type: "external-ui-session" }, (props) =>
      getTestExternalUISessionTokenClaims(props),
    )
    .with({ type: "knode-api" }, (props) => getTestKnodeApiTokenClaims(props))
    .with({ type: "ui-signup-session" }, (props) =>
      getTestUISignupSessionTokenClaims(props),
    )
    .exhaustive();
  return new UnsecuredJWT(claims).encode();
}

export function getTestExternalUISessionTokenClaims(
  props: {
    agreementId?: AgreementId;
    agreementKnodeId?: KnodeId;
    consumerId?: ExternalId<OrganizationId>;
    consumerKnodeId?: KnodeId;
    eserviceId?: EserviceId;
    eserviceKnodeId?: KnodeId;
    eserviceVersionId?: EserviceVersionId;
    producerId?: OrganizationId;
    producerKnodeId?: KnodeId;
    scope?: ExternalUISessionScope;
  } = {},
): ExternalUISessionTokenClaims {
  return {
    agreement: {
      id: props.agreementId ?? TEST_AGREEMENT_ID,
      knode_id: props.agreementKnodeId ?? KnodeId.enum.Orion,
    },
    aud: "test-audience",
    consumer: {
      id: props.consumerId ?? TEST_CONSUMER_ID,
      knode_id: props.consumerKnodeId ?? KnodeId.enum.Orion,
    },
    eservice: {
      id: props.eserviceId ?? TEST_ESERVICE_ID,
      knode_id: props.eserviceKnodeId ?? KnodeId.enum.Orion,
      version: props.eserviceVersionId ?? TEST_ESERVICE_VERSION_ID,
    },
    exp: 9999999999,
    iat: 0,
    iss: "test-issuer",
    jti: "test-jti",
    producer: {
      id: props.producerId ?? TEST_PRODUCER_ID,
      knode_id: props.producerKnodeId ?? KnodeId.enum.Orion,
    },
    scope: props.scope ?? "agreement-activation",
    sub: "test-external-user",
    type: "external-ui-session",
  };
}

export function getTestInternalTokenClaims(): InternalTokenClaims {
  return {
    aud: "test-audience",
    exp: 9999999999,
    iat: 0,
    iss: "test-issuer",
    jti: "test-jti",
    sub: "test-internal-service",
    type: "internal",
  };
}

export function getTestKnodeApiTokenClaims(
  props: {
    keychainId?: KnodeApiKeychainId;
    keychainKnodeId?: KnodeId;
    organizationId?: OrganizationId;
    organizationKnodeId?: KnodeId;
  } = {},
): KnodeApiAccessTokenClaims {
  const keychainId = props.keychainId ?? TEST_KNODE_API_KEYCHAIN_ID;
  return {
    aud: "test-audience",
    client_id: keychainId,
    exp: 9999999999,
    iat: 0,
    iss: "test-issuer",
    jti: "test-jti",
    keychain: {
      id: keychainId,
      knode_id: props.keychainKnodeId ?? KnodeId.enum.Orion,
    },
    nbf: 0,
    organization: {
      id: props.organizationId ?? TEST_ORGANIZATION_ID,
      knode_id: props.organizationKnodeId ?? KnodeId.enum.Orion,
    },
    sub: keychainId,
    type: "knode-api",
  };
}

export function getTestUISessionTokenClaims(
  props: {
    organizationId?: OrganizationId;
    roles?: NonEmptyArray<UserRole>;
    userId?: UserId;
    username?: string;
  } = {},
): UISessionTokenClaims {
  return {
    aud: "test-audience",
    exp: 9999999999,
    iat: 0,
    iss: "test-issuer",
    jti: "test-jti",
    organizationId: props.organizationId ?? TEST_ORGANIZATION_ID,
    roles: props.roles ?? ["administrative"],
    sub: props.userId ?? TEST_USER_ID,
    type: "ui-session",
    username: props.username ?? "test-user",
  };
}

export function getTestUISignupSessionTokenClaims(
  props: {
    dateOfBirth?: string;
    familyName?: string;
    fiscalNumber?: null | string;
    name?: string;
    oneIdNonce?: string;
    personIdentifier?: null | string;
    spidCode?: null | string;
    uniqueIdentifier?: string;
  } = {},
): UISignupSessionTokenClaims {
  // A signup user carries exactly one identifier. Default to spidCode (a SPID
  // login) only when the caller picks none, so passing e.g. personIdentifier
  // alone can't silently leave the default spidCode set too.
  const callerSetIdentifier =
    props.spidCode !== undefined ||
    props.fiscalNumber !== undefined ||
    props.personIdentifier !== undefined;

  return {
    aud: "test-audience",
    dateOfBirth: props.dateOfBirth ?? "2000-01-01",
    exp: 9999999999,
    familyName: props.familyName ?? "User",
    fiscalNumber: props.fiscalNumber === null ? undefined : props.fiscalNumber,
    iat: 0,
    iss: "test-issuer",
    jti: "test-jti",
    name: props.name ?? "Test",
    oneIdNonce: props.oneIdNonce ?? "test-nonce",
    personIdentifier:
      props.personIdentifier === null ? undefined : props.personIdentifier,
    spidCode:
      props.spidCode === null
        ? undefined
        : (props.spidCode ??
          (callerSetIdentifier ? undefined : "test-spid-code")),
    sub: props.uniqueIdentifier ?? "test-unique-identifier",
    type: "ui-signup-session",
  };
}
