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
  payload: Omit<EserviceAccessTokenClaims, "type">;
}

export interface ExternalUISessionMagicLinkToken extends BaseToken {
  payload: ExternalUISessionMagicLinkTokenClaims;
}

export interface ExternalUISessionToken extends BaseToken {
  payload: ExternalUISessionTokenClaims;
}

export interface InternalToken extends BaseToken {
  payload: InternalTokenClaims;
}

export interface KnodeApiAccessToken extends BaseToken {
  payload: KnodeApiAccessTokenClaims;
}

export interface UISessionRefreshToken extends BaseToken {
  payload: UISessionRefreshTokenClaims;
}

export interface UISessionToken extends BaseToken {
  payload: UISessionTokenClaims;
}

export interface UISignupSessionToken extends BaseToken {
  payload: UISignupSessionTokenClaims;
}

interface BaseToken {
  header: string; // base64url-encoded header
  serialized: string; // full JWT string (header.payload.signature)
}
