import { createSign, generateKeyPairSync, randomUUID } from "node:crypto";
import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? "3000");
const ISSUER = process.env.ISSUER ?? "http://localhost:4568";
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ?? "https://localhost:5176,http://localhost:5176"
)
  .split(",")
  .map((s) => s.trim());
const CLIENT_ID = process.env.CLIENT_ID ?? "local-oi-client-id";
const CLIENT_SECRET = process.env.CLIENT_SECRET ?? "local-oi-client-secret";
const DEFAULT_REDIRECT_URI =
  process.env.REDIRECT_URI ?? "http://localhost:5176/ui/login/callback";
const ID_TOKEN_SECONDS_DURATION = Number(
  process.env.ID_TOKEN_SECONDS_DURATION ?? "3600",
);
const JWKS_KEY_ID = "local-one-identity-key";

const USER_ID = "local-one-identity-user";
const NAME = "Mario";
const FAMILY_NAME = "Rossi";
const DATE_OF_BIRTH = "1980-01-01";
const FISCAL_NUMBER = "RSSMRA80A01H501U";
const SPID_CODE = "SPID-001";
const PERSON_IDENTIFIER = "IT/RSSMRA80A01H501U";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const jwk = publicKey.export({ format: "jwk" });
const JWKS = {
  keys: [{ ...jwk, kid: JWKS_KEY_ID, use: "sig", alg: "RS256" }],
};

const authCodes = new Map();

const b64url = (data) => Buffer.from(data).toString("base64url");

function signJwt(payload) {
  const header = b64url(
    JSON.stringify({ alg: "RS256", typ: "JWT", kid: JWKS_KEY_ID }),
  );
  const body = b64url(JSON.stringify(payload));
  const message = `${header}.${body}`;

  const signer = createSign("RSA-SHA256");
  signer.update(message);
  const signature = signer.sign(privateKey, "base64url");

  return `${message}.${signature}`;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

function setCorsHeaders(req, res) {
  const requestOrigin = req.headers.origin;
  const allowedOrigin = ALLOWED_ORIGINS.find((o) => o === requestOrigin);
  if (allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

function writeJson(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function readBasicCredentials(req) {
  const authorization = req.headers.authorization;
  if (!authorization?.toLowerCase().startsWith("basic ")) {
    return null;
  }

  const encoded = authorization.slice("basic ".length);
  const decoded = Buffer.from(encoded, "base64").toString();
  const separatorIndex = decoded.indexOf(":");

  if (separatorIndex === -1) {
    return null;
  }

  return {
    clientId: decoded.slice(0, separatorIndex),
    clientSecret: decoded.slice(separatorIndex + 1),
  };
}

function isAllowedRedirect(target) {
  try {
    const parsed = new URL(target);
    const configuredRedirect = new URL(DEFAULT_REDIRECT_URI);
    const allowedOrigins = ALLOWED_ORIGINS.map((origin) => new URL(origin));

    return (
      parsed.toString() === configuredRedirect.toString() ||
      allowedOrigins.some((origin) => parsed.origin === origin.origin)
    );
  } catch {
    return false;
  }
}

function handleLogin(url, res) {
  const clientId = url.searchParams.get("client_id");
  const nonce = url.searchParams.get("nonce");
  const redirectUri = url.searchParams.get("redirect_uri");
  const responseType = url.searchParams.get("response_type");
  const scope = url.searchParams.get("scope");
  const state = url.searchParams.get("state");

  if (
    clientId !== CLIENT_ID ||
    !nonce ||
    !redirectUri ||
    responseType !== "code" ||
    scope !== "openid" ||
    !state
  ) {
    writeJson(res, 400, { error: "invalid_request" });
    return;
  }

  if (!isAllowedRedirect(redirectUri)) {
    writeJson(res, 400, { error: "invalid_redirect_uri" });
    return;
  }

  const code = randomUUID();
  authCodes.set(code, {
    clientId,
    createdAt: Date.now(),
    nonce,
    redirectUri,
  });

  const redirect = new URL(redirectUri);
  redirect.searchParams.set("code", code);
  redirect.searchParams.set("state", state);

  console.log(`[login] Issued code ${code} for client ${clientId}`);

  res.writeHead(302, { Location: redirect.toString() });
  res.end();
}

async function handleToken(req, res) {
  const credentials = readBasicCredentials(req);
  if (
    credentials?.clientId !== CLIENT_ID ||
    credentials.clientSecret !== CLIENT_SECRET
  ) {
    writeJson(res, 401, { error: "invalid_client" });
    return;
  }

  const params = new URLSearchParams(await readBody(req));
  const code = params.get("code");
  const grantType = params.get("grant_type");
  const redirectUri = params.get("redirect_uri");

  if (grantType !== "authorization_code" || !code || !redirectUri) {
    writeJson(res, 400, { error: "invalid_request" });
    return;
  }

  const codeData = authCodes.get(code);
  if (!codeData || codeData.redirectUri !== redirectUri) {
    writeJson(res, 400, { error: "invalid_grant" });
    return;
  }
  authCodes.delete(code);

  const now = Math.floor(Date.now() / 1000);
  const idToken = signJwt({
    aud: codeData.clientId,
    dateOfBirth: DATE_OF_BIRTH,
    exp: now + ID_TOKEN_SECONDS_DURATION,
    familyName: FAMILY_NAME,
    fiscalNumber: FISCAL_NUMBER,
    iat: now,
    iss: ISSUER,
    name: NAME,
    nonce: codeData.nonce,
    PersonIdentifier: PERSON_IDENTIFIER,
    spidCode: SPID_CODE,
    sub: USER_ID,
  });

  const accessToken = signJwt({
    aud: codeData.clientId,
    exp: now + ID_TOKEN_SECONDS_DURATION,
    iat: now,
    iss: ISSUER,
    scope: "openid",
    sub: USER_ID,
  });

  console.log(`[token] Exchanged code ${code} for tokens`);

  writeJson(res, 200, {
    access_token: accessToken,
    expires_in: ID_TOKEN_SECONDS_DURATION,
    id_token: idToken,
    scope: "openid",
    token_type: "Bearer",
  });
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (
      req.method === "GET" &&
      url.pathname === "/.well-known/openid-configuration"
    ) {
      writeJson(res, 200, {
        authorization_endpoint: `${ISSUER}/login`,
        grant_types_supported: ["authorization_code"],
        id_token_signing_alg_values_supported: ["RS256"],
        issuer: ISSUER,
        jwks_uri: `${ISSUER}/jwks`,
        response_types_supported: ["code"],
        scopes_supported: ["openid"],
        subject_types_supported: ["public"],
        token_endpoint: `${ISSUER}/oidc/token`,
        token_endpoint_auth_methods_supported: ["client_secret_basic"],
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/jwks") {
      writeJson(res, 200, JWKS);
      return;
    }

    if (req.method === "GET" && url.pathname === "/login") {
      handleLogin(url, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/oidc/token") {
      await handleToken(req, res);
      return;
    }

    res.writeHead(404);
    res.end();
  } catch (error) {
    console.error("Error:", error);
    writeJson(res, 500, { error: error.message });
  }
}).listen(PORT, () => {
  console.log(`Local One Identity provider started on port ${PORT}`);
  console.log(`Issuer: ${ISSUER}`);
  console.log(`Discovery: ${ISSUER}/.well-known/openid-configuration`);
  console.log(`Client ID: ${CLIENT_ID}`);
  console.log(`Redirect URI: ${DEFAULT_REDIRECT_URI}`);
});
