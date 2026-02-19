import { KMSClient, SignCommand } from "@aws-sdk/client-kms";
import { createHash, randomUUID } from "node:crypto";
import { createServer } from "node:http";

const KMS_ENDPOINT = process.env.KMS_ENDPOINT ?? "http://localhost:4566";

// Hardcoded configuration for local development
const USER_ID = "00000000-0000-0000-0000-000000000001";
const ORG_ID = "00000000-0000-0000-0000-000000000002";
const ROLES = ["role:administrative", "role:technical"];

createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:3000");

  if (req.method !== "GET" || url.pathname !== "/login") {
    res.writeHead(404);
    res.end();
    return;
  }

  try {
    const kmsClient = new KMSClient({
      endpoint: KMS_ENDPOINT,
      region: "eu-south-1",
      credentials: {
        accessKeyId: "testawskey",
        secretAccessKey: "testawssecret",
      },
    });

    // Base64url encode helper
    const b64url = (data) => Buffer.from(data).toString("base64url");

    // Build JWT header
    const header = b64url(
      JSON.stringify({ alg: "RS256", typ: "JWT", kid: `local-cognito-key` }),
    );

    // Build JWT payload
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      sub: USER_ID,
      "cognito:groups": [...ROLES, `org:${ORG_ID}`],
      token_use: "access",
    };

    const payload = b64url(
      JSON.stringify({
        ...claims,
        iat: now,
        exp: now + 3600,
        jti: randomUUID(),
        iss: `local-cognito`,
        aud: "local.knodia.test/ui-session",
      }),
    );

    // Sign with KMS using the alias directly
    const message = `${header}.${payload}`;
    const digest = createHash("sha256").update(message).digest();

    const { Signature } = await kmsClient.send(
      new SignCommand({
        KeyId: `alias/local-cognito-key`,
        Message: digest,
        MessageType: "DIGEST",
        SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256",
      }),
    );

    const signature = Buffer.from(Signature).toString("base64url");
    const token = `${message}.${signature}`;

    console.log(`Generated token:`);
    console.log(token);

    const returnUrl = url.searchParams.get("return_url");
    if (returnUrl) {
      const redirectUrl = new URL(returnUrl);
      redirectUrl.searchParams.set("token", token);
      res.writeHead(302, { Location: redirectUrl.toString() });
      res.end();
    } else {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ token }));
    }
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  }
}).listen(3000, () => {
  console.log("Server started on port 3000");
});
