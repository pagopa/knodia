import type {
  EserviceAccessTokenClaims,
  ExternalUISessionMagicLinkTokenClaims,
  ExternalUISessionTokenClaims,
  InternalTokenClaims,
  KnodeApiAccessTokenClaims,
  UISessionRefreshTokenClaims,
  UISessionTokenClaims,
  UISignupSessionTokenClaims,
} from "@knodia/common-models/auth";

export interface EserviceAccessToken extends BaseToken {
  payload: EserviceAccessTokenClaims;
}

export interface ExternalUISessionMagicLinkToken extends BaseToken {
  payload: ExternalUISessionMagicLinkTokenClaims;
  type: "external-ui-session-magic-link";
}

export interface ExternalUISessionToken extends BaseToken {
  payload: ExternalUISessionTokenClaims;
  type: "external-ui-session";
}

export interface InternalToken extends BaseToken {
  payload: InternalTokenClaims;
  type: "internal";
}

export interface KnodeApiAccessToken extends BaseToken {
  payload: KnodeApiAccessTokenClaims;
  type: "knode-api";
}

export interface UISessionRefreshToken extends BaseToken {
  payload: UISessionRefreshTokenClaims;
  type: "refresh-ui-session";
}

export interface UISessionToken extends BaseToken {
  payload: UISessionTokenClaims;
  type: "ui-session";
}

export interface UISignupSessionToken extends BaseToken {
  payload: UISignupSessionTokenClaims;
  type: "signup-session";
}

interface BaseToken {
  header: string; // base64url-encoded header
  serialized: string; // full JWT string (header.payload.signature)
}
