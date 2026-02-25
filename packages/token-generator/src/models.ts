import type {
  InternalTokenClaims,
  RefreshTokenClaims,
  UISessionTokenClaims,
} from "@knodia/common-models/auth";

export interface InternalToken extends BaseToken {
  payload: InternalTokenClaims;
  type: "internal";
}

export interface RefreshToken extends BaseToken {
  payload: RefreshTokenClaims;
  type: "refresh";
}

export interface UISessionToken extends BaseToken {
  payload: UISessionTokenClaims;
  type: "ui-session";
}

interface BaseToken {
  header: string; // base64url-encoded header
  serialized: string; // full JWT string (header.payload.signature)
}
