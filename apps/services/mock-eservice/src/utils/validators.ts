import type {
  EserviceId,
  EserviceVersionId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";

import { requestContext } from "@fastify/request-context";
import { EserviceAccessTokenClaims } from "@knodia/common-models/auth";
import { verifyAgainstJwksSets } from "@knodia/fastify-zod-api-commons/auth";
import { unauthorizedError } from "@knodia/fastify-zod-api-commons/models";
import { type JWTVerifyGetKey } from "jose";
import { prettifyError } from "zod";

interface VerifyOptions {
  acceptedAudiences: string[];
  expectedIssuer: string;
  jwksResolvers: JWTVerifyGetKey[];
}

export function assertTokenClaimsAreValidForEservice(
  expectedEserviceId: EserviceId,
  expectedEserviceVersionId: EserviceVersionId,
  expectedProducerId: OrganizationId,
  knodeId: KnodeId,
) {
  const claims = requestContext.get("accessTokenClaims");
  if (!claims) {
    throw unauthorizedError("Missing access token claims");
  }

  const { eservice, producer, purpose } = claims;
  const mismatches: string[] = [];
  if (eservice.id !== expectedEserviceId) {
    mismatches.push(
      `eservice.id ${eservice.id} does not match ${expectedEserviceId}`,
    );
  }
  if (eservice.version !== expectedEserviceVersionId) {
    mismatches.push(
      `eservice.version ${eservice.version} does not match ${expectedEserviceVersionId}`,
    );
  }
  if (eservice.knode_id !== knodeId) {
    mismatches.push(
      `eservice.knode_id ${eservice.knode_id} does not match ${knodeId}`,
    );
  }
  if (producer.id !== expectedProducerId) {
    mismatches.push(
      `producer.id ${producer.id} does not match ${expectedProducerId}`,
    );
  }
  if (producer.knode_id !== knodeId) {
    mismatches.push(
      `producer.knode_id ${producer.knode_id} does not match ${knodeId}`,
    );
  }
  if (purpose.knode_id !== knodeId) {
    mismatches.push(
      `purpose.knode_id ${purpose.knode_id} does not match ${knodeId}`,
    );
  }

  if (mismatches.length > 0) {
    throw unauthorizedError(
      `Access token does not target this e-service: ${mismatches.join("; ")}`,
    );
  }
}
export async function verifyEserviceAccessToken(
  token: string,
  opts: VerifyOptions,
  requireDpopBinding: true,
): Promise<
  EserviceAccessTokenClaims & {
    cnf: { jkt: string };
  }
>;
export async function verifyEserviceAccessToken(
  token: string,
  opts: VerifyOptions,
  requireDpopBinding?: false,
): Promise<EserviceAccessTokenClaims>;
export async function verifyEserviceAccessToken(
  token: string,
  opts: VerifyOptions,
  requireDpopBinding = false,
): Promise<EserviceAccessTokenClaims> {
  const rawPayload = await verifyAgainstJwksSets({
    audience: opts.acceptedAudiences,
    issuer: opts.expectedIssuer,
    jwksSets: opts.jwksResolvers,
    propagateReasons: true,
    token,
    typ: "at+jwt",
  });

  const parsed = EserviceAccessTokenClaims.safeParse(rawPayload);
  if (!parsed.success) {
    throw unauthorizedError(
      `Invalid access token claims:\n${prettifyError(parsed.error)}`,
    );
  }

  if (requireDpopBinding) {
    if (!parsed.data.cnf?.jkt) {
      throw unauthorizedError(
        "DPoP bound access token is missing DPoP thumbprint claim (cnf.jkt)",
      );
    }
    return parsed.data;
  } else {
    if (parsed.data.cnf?.jkt) {
      throw unauthorizedError(
        "Bearer access tokens must not contain DPoP thumbprint claim (cnf.jkt)",
      );
    }
  }

  return parsed.data;
}
