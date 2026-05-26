import { generateKeyPairSync, createSign, randomUUID } from "node:crypto";
import { createServer } from "node:http";

const PORT = 3000;
const ISSUER = process.env.ISSUER ?? "http://localhost:4567";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5175")
  .split(",")
  .map((s) => s.trim());
const DEFAULT_USER_POOL_ID =
  process.env.USER_POOL_ID ?? "local-user-pool-id-for-tests";

// Hardcoded user for local development
const USER_ID = "00000000-0000-4000-8000-000000000001";
const USERNAME = "Mario Rossi";
const ORG_ID = "00000000-0000-4000-8000-000000000002";
const ROLES = ["administrative", "technical"];
const NOW_IN_SECONDS = Math.floor(Date.now() / 1000);
let MOCK_USERS = [
  {
    Attributes: [
      { Name: "sub", Value: USER_ID },
      { Name: "email", Value: "mario.rossi@example.com" },
      { Name: "email_verified", Value: "true" },
      { Name: "given_name", Value: "Mario" },
      { Name: "family_name", Value: "Rossi" },
      { Name: "custom:organizationId", Value: ORG_ID },
      { Name: "custom:roles", Value: ROLES.join(",") },
    ],
    Enabled: true,
    Groups: [`org:${ORG_ID}`],
    UserCreateDate: NOW_IN_SECONDS - 86_400,
    UserLastModifiedDate: NOW_IN_SECONDS - 3_600,
    UserStatus: "CONFIRMED",
    Username: "Mario Rossi",
  },
  {
    Attributes: [
      { Name: "sub", Value: "00000000-0000-4000-8000-000000000002" },
      { Name: "email", Value: "tecnico.roma@example.com" },
      { Name: "email_verified", Value: "true" },
      { Name: "given_name", Value: "Tecnico" },
      { Name: "family_name", Value: "Roma" },
      { Name: "custom:organizationId", Value: ORG_ID },
      { Name: "custom:roles", Value: "technical" },
    ],
    Enabled: true,
    Groups: [`org:${ORG_ID}`],
    UserCreateDate: NOW_IN_SECONDS - 64_800,
    UserLastModifiedDate: NOW_IN_SECONDS - 2_700,
    UserStatus: "CONFIRMED",
    Username: "Tecnico Roma",
  },
  {
    Attributes: [
      { Name: "sub", Value: "00000000-0000-4000-8000-000000000003" },
      { Name: "email", Value: "giulia.bianchi@example.com" },
      { Name: "email_verified", Value: "true" },
      { Name: "given_name", Value: "Giulia" },
      { Name: "family_name", Value: "Bianchi" },
      { Name: "custom:organizationId", Value: ORG_ID },
      { Name: "custom:roles", Value: "administrative" },
    ],
    Enabled: true,
    Groups: [`org:${ORG_ID}`],
    UserCreateDate: NOW_IN_SECONDS - 43_200,
    UserLastModifiedDate: NOW_IN_SECONDS - 1_800,
    UserStatus: "CONFIRMED",
    Username: "Giulia Bianchi",
  },
  {
    Attributes: [
      { Name: "sub", Value: "00000000-0000-4000-8000-000000000004" },
      { Name: "email", Value: "luca.neri@example.com" },
      { Name: "email_verified", Value: "true" },
      { Name: "given_name", Value: "Luca" },
      { Name: "family_name", Value: "Neri" },
      {
        Name: "custom:organizationId",
        Value: "00000000-0000-4000-8000-000000000099",
      },
      { Name: "custom:roles", Value: "technical" },
    ],
    Enabled: true,
    Groups: ["org:00000000-0000-4000-8000-000000000099"],
    UserCreateDate: NOW_IN_SECONDS - 21_600,
    UserLastModifiedDate: NOW_IN_SECONDS - 900,
    UserStatus: "CONFIRMED",
    Username: "Luca Neri",
  },
];

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const jwk = publicKey.export({ format: "jwk" });
const JWKS = {
  keys: [{ ...jwk, kid: "local-cognito-key", use: "sig", alg: "RS256" }],
};

// Auth codes for the authorization code flow (consumed immediately by /token)
const authCodes = new Map();

const b64url = (data) => Buffer.from(data).toString("base64url");

function signJwt(payload) {
  const header = b64url(
    JSON.stringify({ alg: "RS256", typ: "JWT", kid: "local-cognito-key" }),
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

function readJsonBody(req) {
  return readBody(req).then((body) => {
    if (!body) return {};
    return JSON.parse(body);
  });
}

function setCorsHeaders(req, res) {
  const requestOrigin = req.headers.origin;
  const allowedOrigin = ALLOWED_ORIGINS.find((o) => o === requestOrigin);
  if (allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function isAllowedRedirect(target) {
  try {
    const parsed = new URL(target);
    const issuerOrigin = new URL(ISSUER).origin;
    const allowedOrigins = ALLOWED_ORIGINS.map((o) => new URL(o).origin);
    return (
      allowedOrigins.includes(parsed.origin) || parsed.origin === issuerOrigin
    );
  } catch {
    return false;
  }
}

function writeJson(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function paginateItems(items, limit, nextToken, responseKey) {
  const safeLimit =
    typeof limit === "number" && limit > 0 ? Math.floor(limit) : 60;
  const startIndex = nextToken ? Number.parseInt(nextToken, 10) : 0;
  const page = items.slice(startIndex, startIndex + safeLimit);
  const nextIndex = startIndex + safeLimit;

  return {
    NextToken: nextIndex < items.length ? String(nextIndex) : undefined,
    [responseKey]: page,
  };
}

function filterUsersByGroup(groupName) {
  return MOCK_USERS.filter((user) => user.Groups?.includes(groupName));
}

function findUserByUsername(username) {
  return MOCK_USERS.find(
    (user) => user.Username === username
  );
}

function filterUsers(payload) {
  const filter = payload.Filter;
  if (!filter) {
    return MOCK_USERS;
  }

  const subFilterMatch = /^sub\s*=\s*"([^"]+)"$/.exec(filter);
  if (subFilterMatch) {
    const sub = subFilterMatch[1];
    return MOCK_USERS.filter((user) =>
      user.Attributes?.some(
        (attribute) => attribute.Name === "sub" && attribute.Value === sub,
      ),
    );
  }

  return [];
}

function removeUserByIdentifier(identifier) {
  const before = MOCK_USERS.length;
  MOCK_USERS = MOCK_USERS.filter(
    (user) =>
      user.Username !== identifier &&
      !user.Attributes?.some(
        (attribute) =>
          attribute.Name === "sub" && attribute.Value === identifier,
      ),
  );
  return before - MOCK_USERS.length;
}

function handleListUsersInGroup(req, res, payload) {
  const filteredUsers = filterUsersByGroup(payload.GroupName);
  const response = paginateItems(
    filteredUsers,
    payload.Limit,
    payload.NextToken,
    "Users",
  );

  console.log(
    `[list-users-in-group] Returned ${response.Users.length} users for group ${payload.GroupName} in pool ${payload.UserPoolId ?? DEFAULT_USER_POOL_ID}`,
  );

  writeJson(res, 200, response, {
    "x-amz-target": req.headers["x-amz-target"] ?? "",
  });
}

function handleListUsers(req, res, payload) {
  const filteredUsers = filterUsers(payload);
  const response = paginateItems(
    filteredUsers,
    payload.Limit,
    payload.PaginationToken,
    "Users",
  );

  console.log(
    `[list-users] Returned ${response.Users.length} users for filter ${payload.Filter ?? "<none>"} in pool ${payload.UserPoolId ?? DEFAULT_USER_POOL_ID}`,
  );

  writeJson(res, 200, response, {
    "x-amz-target": req.headers["x-amz-target"] ?? "",
  });
}

function handleAdminDeleteUser(req, res, payload) {
  const removed = removeUserByIdentifier(payload.Username);

  console.log(
    `[admin-delete-user] Removed ${removed} user(s) for user ${payload.Username} in pool ${payload.UserPoolId ?? DEFAULT_USER_POOL_ID}`,
  );

  writeJson(
    res,
    200,
    {},
    {
      "x-amz-target": req.headers["x-amz-target"] ?? "",
    },
  );
}

function handleAdminListGroupsForUser(req, res, payload) {
  const user = findUserByUsername(payload.Username);
  const groups = (user?.Groups ?? []).map((groupName) => ({
    GroupName: groupName,
  }));
  const response = paginateItems(
    groups,
    payload.Limit,
    payload.NextToken,
    "Groups",
  );

  console.log(
    `[admin-list-groups-for-user] Returned ${response.Groups.length} groups for user ${payload.Username} in pool ${payload.UserPoolId ?? DEFAULT_USER_POOL_ID}`,
  );

  writeJson(res, 200, response, {
    "x-amz-target": req.headers["x-amz-target"] ?? "",
  });
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  setCorsHeaders(req, res);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // OpenID Connect Discovery
    if (
      req.method === "GET" &&
      url.pathname === "/.well-known/openid-configuration"
    ) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          issuer: ISSUER,
          authorization_endpoint: `${ISSUER}/authorize`,
          token_endpoint: `${ISSUER}/token`,
          end_session_endpoint: `${ISSUER}/logout`,
          jwks_uri: `${ISSUER}/jwks`,
          response_types_supported: ["code"],
          subject_types_supported: ["public"],
          id_token_signing_alg_values_supported: ["RS256"],
          scopes_supported: ["openid", "email", "phone"],
          token_endpoint_auth_methods_supported: ["none"],
          grant_types_supported: ["authorization_code"],
        }),
      );
      return;
    }

    // JWKS endpoint
    if (req.method === "GET" && url.pathname === "/jwks") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(JWKS));
      return;
    }

    // Minimal mock for Cognito User Pool administrative APIs used in local tests
    if (req.method === "POST" && url.pathname === "/") {
      const target = req.headers["x-amz-target"];
      const payload = await readJsonBody(req);

      if (target === "AWSCognitoIdentityProviderService.ListUsersInGroup") {
        handleListUsersInGroup(req, res, payload);
        return;
      }

      if (target === "AWSCognitoIdentityProviderService.ListUsers") {
        handleListUsers(req, res, payload);
        return;
      }

      if (
        target === "AWSCognitoIdentityProviderService.AdminListGroupsForUser"
      ) {
        handleAdminListGroupsForUser(req, res, payload);
        return;
      }

      if (target === "AWSCognitoIdentityProviderService.AdminDeleteUser") {
        handleAdminDeleteUser(req, res, payload);
        return;
      }
    }

    // Authorization endpoint — auto-approve, redirect with code
    if (req.method === "GET" && url.pathname === "/authorize") {
      const redirectUri = url.searchParams.get("redirect_uri");
      const state = url.searchParams.get("state");
      const nonce = url.searchParams.get("nonce");
      const clientId = url.searchParams.get("client_id");

      if (!redirectUri || !state) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ error: "redirect_uri and state are required" }),
        );
        return;
      }

      const code = randomUUID();
      authCodes.set(code, {
        redirectUri,
        nonce,
        clientId,
        createdAt: Date.now(),
      });

      const redirect = new URL(redirectUri);
      redirect.searchParams.set("code", code);
      redirect.searchParams.set("state", state);

      console.log(`[authorize] Issued code ${code} for client ${clientId}`);

      res.writeHead(302, { Location: redirect.toString() });
      res.end();
      return;
    }

    // Token endpoint — exchange code for tokens
    if (req.method === "POST" && url.pathname === "/token") {
      const body = await readBody(req);
      const params = new URLSearchParams(body);

      const grantType = params.get("grant_type");
      const code = params.get("code");
      const clientId = params.get("client_id");

      if (grantType !== "authorization_code" || !code) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid_request" }));
        return;
      }

      const codeData = authCodes.get(code);
      if (!codeData) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid_grant" }));
        return;
      }
      authCodes.delete(code);

      const now = Math.floor(Date.now() / 1000);

      const accessToken = signJwt({
        sub: USER_ID,
        username: USERNAME,
        "cognito:groups": [`org:${ORG_ID}`],
        token_use: "access",
        iss: ISSUER,
        aud: "local.knodia.test/ui-session",
        iat: now,
        exp: now + 3600,
        jti: randomUUID(),
      });

      const idToken = signJwt({
        sub: USER_ID,
        iss: ISSUER,
        token_use: "id",
        "cognito:groups": [`org:${ORG_ID}`],
        "custom:roles": ROLES.map((role) => role.replace("role:", "")).join(","),
        "cognito:username": USERNAME,
        aud: clientId || codeData.clientId,
        iat: now,
        exp: now + 3600,
        nonce: codeData.nonce,
      });

      console.log(`[token] Exchanged code ${code} for tokens`);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          access_token: accessToken,
          id_token: idToken,
          token_type: "Bearer",
          expires_in: 3600,
        }),
      );
      return;
    }

    // Logout endpoint — redirect to logout_uri
    if (req.method === "GET" && url.pathname === "/logout") {
      const logoutUri = url.searchParams.get("logout_uri");

      if (!logoutUri) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "logout_uri is required" }));
        return;
      }

      if (!isAllowedRedirect(logoutUri)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ error: "logout_uri is not an allowed redirect" }),
        );
        return;
      }

      console.log(`[logout] Redirecting to ${logoutUri}`);

      res.writeHead(302, { Location: logoutUri });
      res.end();
      return;
    }

    res.writeHead(404);
    res.end();
  } catch (error) {
    console.error("Error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  }
}).listen(PORT, () => {
  console.log(`Local OIDC provider started on port ${PORT}`);
  console.log(`Issuer: ${ISSUER}`);
  console.log(`Discovery: ${ISSUER}/.well-known/openid-configuration`);
});
