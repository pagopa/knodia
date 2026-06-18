import type { defaultProvider } from "@aws-sdk/credential-provider-node";
import type { RedisClientOptions } from "redis";

import { Sha256 } from "@aws-crypto/sha256-js";
import { formatUrl } from "@aws-sdk/util-format-url";
import { HttpRequest } from "@smithy/protocol-http";
import { SignatureV4 } from "@smithy/signature-v4";

// `AsyncCredentialsProvider` isn't re-exported from the `redis` entrypoint, so
// extract it from the publicly-exported `RedisClientOptions` union instead of
// reaching into `@redis/client`'s internal subpaths.
type AsyncCredentialsProvider = Extract<
  NonNullable<RedisClientOptions["credentialsProvider"]>,
  { type: "async-credentials-provider" }
>;

type AwsCredentialsProvider = ReturnType<typeof defaultProvider>;

// 15 minutes — AWS rejects tokens older than this. node-redis re-invokes
// `credentials()` on every (re)connect, so a fresh URL is signed before each
// handshake; the cap is fine for ElastiCache's 12h hard disconnect cycle.
const TOKEN_EXPIRY_SECONDS = 900;

interface AwsIamAuth {
  // Lower-cased upstream in config.ts — ElastiCache lowercases cache names at
  // creation and AUTH rejects mixed-case forms.
  cacheName: string;
  isServerless: boolean;
  region: string;
  userId: string;
}

export function buildAwsIamCredentialsProvider(
  auth: AwsIamAuth,
  credentials: AwsCredentialsProvider,
): AsyncCredentialsProvider {
  const signer = new SignatureV4({
    credentials,
    region: auth.region,
    service: "elasticache",
    sha256: Sha256,
  });

  const baseQuery: Record<string, string> = {
    Action: "connect",
    User: auth.userId,
  };
  if (auth.isServerless) {
    baseQuery["ResourceType"] = "ServerlessCache";
  }

  return {
    credentials: async () => {
      // AWS docs prescribe `http://` as the canonical signing scheme, then
      // the prefix is stripped from the returned token. TLS is independent —
      // node-redis handles it via `socket.tls: true`.
      const request = new HttpRequest({
        headers: { host: auth.cacheName },
        hostname: auth.cacheName,
        method: "GET",
        path: "/",
        protocol: "http:",
        query: { ...baseQuery },
      });
      const presigned = await signer.presign(request, {
        expiresIn: TOKEN_EXPIRY_SECONDS,
      });
      const url = formatUrl(presigned);
      return {
        password: url.replace(/^http:\/\//, ""),
        username: auth.userId,
      };
    },
    type: "async-credentials-provider",
  };
}
