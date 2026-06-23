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
const USERNAME = "mario_rossi";
const ORG_ID = "00000000-0000-4000-8000-000000000002";
const ROLES = ["administrative", "technical"];
const NOW_IN_SECONDS = Math.floor(Date.now() / 1000);
const MOCK_USERS = [
  {
    Attributes: [
      { Name: "sub", Value: USER_ID },
      { Name: "email", Value: "mario.rossi@example.com" },
      { Name: "email_verified", Value: "true" },
      { Name: "given_name", Value: "Mario" },
      { Name: "family_name", Value: "Rossi" },
      { Name: "custom:roles", Value: ROLES.join(",") },
    ],
    Enabled: true,
    Groups: [`org:${ORG_ID}`],
    UserCreateDate: NOW_IN_SECONDS - 86_400,
    UserLastModifiedDate: NOW_IN_SECONDS - 3_600,
    UserStatus: "CONFIRMED",
    Username: USERNAME,
  },
  {
    Attributes: [
      { Name: "sub", Value: "00000000-0000-4000-8000-000000000002" },
      { Name: "email", Value: "tecnico.roma@example.com" },
      { Name: "email_verified", Value: "true" },
      { Name: "given_name", Value: "Tecnico" },
      { Name: "family_name", Value: "Roma" },
      { Name: "custom:roles", Value: "technical" },
    ],
    Enabled: true,
    Groups: [`org:${ORG_ID}`],
    UserCreateDate: NOW_IN_SECONDS - 64_800,
    UserLastModifiedDate: NOW_IN_SECONDS - 2_700,
    UserStatus: "CONFIRMED",
    Username: "tecnico_roma",
  },
  {
    Attributes: [
      { Name: "sub", Value: "00000000-0000-4000-8000-000000000003" },
      { Name: "email", Value: "giulia.bianchi@example.com" },
      { Name: "email_verified", Value: "true" },
      { Name: "given_name", Value: "Giulia" },
      { Name: "family_name", Value: "Bianchi" },
      { Name: "custom:roles", Value: "administrative" },
    ],
    Enabled: true,
    Groups: [`org:${ORG_ID}`],
    UserCreateDate: NOW_IN_SECONDS - 43_200,
    UserLastModifiedDate: NOW_IN_SECONDS - 1_800,
    UserStatus: "CONFIRMED",
    Username: "giulia_bianchi",
  },
  {
    Attributes: [
      { Name: "sub", Value: "00000000-0000-4000-8000-000000000004" },
      { Name: "email", Value: "luca.neri@example.com" },
      { Name: "email_verified", Value: "true" },
      { Name: "given_name", Value: "Luca" },
      { Name: "family_name", Value: "Neri" },
      { Name: "custom:roles", Value: "technical" },
    ],
    Enabled: true,
    Groups: ["org:00000000-0000-4000-8000-000000000099"],
    UserCreateDate: NOW_IN_SECONDS - 21_600,
    UserLastModifiedDate: NOW_IN_SECONDS - 900,
    UserStatus: "CONFIRMED",
    Username: "luca_neri",
  },
  // POC UC02 users — one per POC org (ids match scripts/seed/sql/{lynx,orion}
  // and scripts/local-auth/generate-token.mjs). All roles, no role-based behaviour.
  {
    Attributes: [
      { Name: "sub", Value: "00000000-0000-4000-8000-000000000101" },
      { Name: "email", Value: "admin@businessbookletlynx.example.com" },
      { Name: "email_verified", Value: "true" },
      { Name: "given_name", Value: "Business Booklet" },
      { Name: "family_name", Value: "Lynx" },
      {
        Name: "custom:organizationId",
        Value: "00000000-0000-4000-8000-000000000101",
      },
      { Name: "custom:roles", Value: "administrative,technical" },
    ],
    Enabled: true,
    Groups: ["org:00000000-0000-4000-8000-000000000101"],
    UserCreateDate: NOW_IN_SECONDS - 21_600,
    UserLastModifiedDate: NOW_IN_SECONDS - 900,
    UserStatus: "CONFIRMED",
    Username: "business_booklet_lynx_admin",
  },
  {
    Attributes: [
      { Name: "sub", Value: "00000000-0000-4000-8000-000000000102" },
      { Name: "email", Value: "admin@constructioncompaniesregistryorion.example.com" },
      { Name: "email_verified", Value: "true" },
      { Name: "given_name", Value: "Construction Companies Registry" },
      { Name: "family_name", Value: "Orion" },
      {
        Name: "custom:organizationId",
        Value: "00000000-0000-4000-8000-000000000102",
      },
      { Name: "custom:roles", Value: "administrative,technical" },
    ],
    Enabled: true,
    Groups: ["org:00000000-0000-4000-8000-000000000102"],
    UserCreateDate: NOW_IN_SECONDS - 21_600,
    UserLastModifiedDate: NOW_IN_SECONDS - 900,
    UserStatus: "CONFIRMED",
    Username: "construction_companies_registry_orion_admin",
  },
  // POC UC01 users — one per POC org (ids match scripts/seed/sql/{lynx,orion}
  // and scripts/local-auth/generate-token.mjs). All roles, no role-based behaviour.
  {
    Attributes: [
      { Name: "sub", Value: "00000000-0000-4000-8000-000000000103" },
      { Name: "email", Value: "admin@studentregistrylynx.example.com" },
      { Name: "email_verified", Value: "true" },
      { Name: "given_name", Value: "Student Registry" },
      { Name: "family_name", Value: "Lynx" },
      {
        Name: "custom:organizationId",
        Value: "00000000-0000-4000-8000-000000000103",
      },
      { Name: "custom:roles", Value: "administrative,technical" },
    ],
    Enabled: true,
    Groups: ["org:00000000-0000-4000-8000-000000000103"],
    UserCreateDate: NOW_IN_SECONDS - 21_600,
    UserLastModifiedDate: NOW_IN_SECONDS - 900,
    UserStatus: "CONFIRMED",
    Username: "student_registry_lynx_admin",
  },
  {
    Attributes: [
      { Name: "sub", Value: "00000000-0000-4000-8000-000000000104" },
      { Name: "email", Value: "admin@academyorion.example.com" },
      { Name: "email_verified", Value: "true" },
      { Name: "given_name", Value: "Academy" },
      { Name: "family_name", Value: "Orion" },
      {
        Name: "custom:organizationId",
        Value: "00000000-0000-4000-8000-000000000104",
      },
      { Name: "custom:roles", Value: "administrative,technical" },
    ],
    Enabled: true,
    Groups: ["org:00000000-0000-4000-8000-000000000104"],
    UserCreateDate: NOW_IN_SECONDS - 21_600,
    UserLastModifiedDate: NOW_IN_SECONDS - 900,
    UserStatus: "CONFIRMED",
    Username: "academy_orion_admin",
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

// Strip CR/LF so user-provided values can't forge extra log lines.
function sanitizeForLog(value) {
  return String(value).replace(/\n|\r/g, " ");
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

function removeUserByUsername(username) {
  const idx = MOCK_USERS.findIndex((user) => user.Username === username);
  if (idx === -1) return 0;
  MOCK_USERS.splice(idx, 1);
  return 1;
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
  const removed = removeUserByUsername(payload.Username);

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

function handleAdminDisableUser(req, res, payload) {
  const user = findUserByUsername(payload.Username);
  if (user) {
    user.Enabled = false;
  }

  console.log(
    `[admin-disable-user] Disabled user ${payload.Username} in pool ${payload.UserPoolId ?? DEFAULT_USER_POOL_ID}`,
  );

  writeJson(res, 200, {}, {
    "x-amz-target": req.headers["x-amz-target"] ?? "",
  });
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

function handleCreateGroup(req, res, payload) {
  console.log(
    `[create-group] ${payload.GroupName} in pool ${payload.UserPoolId ?? DEFAULT_USER_POOL_ID}`,
  );

  writeJson(
    res,
    200,
    {
      Group: {
        GroupName: payload.GroupName,
        UserPoolId: payload.UserPoolId ?? DEFAULT_USER_POOL_ID,
      },
    },
    { "x-amz-target": req.headers["x-amz-target"] ?? "" },
  );
}

function handleAdminCreateUser(req, res, payload) {
  const existing = findUserByUsername(payload.Username);
  if (existing) {
    console.log(`[admin-create-user] ${payload.Username} already exists`);
    writeJson(
      res,
      200,
      { User: existing },
      { "x-amz-target": req.headers["x-amz-target"] ?? "" },
    );
    return;
  }

  const attributes = payload.UserAttributes ?? [];
  const user = {
    Attributes: attributes.some((attribute) => attribute.Name === "sub")
      ? attributes
      : [...attributes, { Name: "sub", Value: randomUUID() }],
    Enabled: true,
    Groups: [],
    UserCreateDate: NOW_IN_SECONDS,
    UserLastModifiedDate: NOW_IN_SECONDS,
    UserStatus: "CONFIRMED",
    Username: payload.Username,
  };
  MOCK_USERS.push(user);

  console.log(
    `[admin-create-user] created ${payload.Username} in pool ${payload.UserPoolId ?? DEFAULT_USER_POOL_ID}`,
  );

  writeJson(
    res,
    200,
    { User: user },
    { "x-amz-target": req.headers["x-amz-target"] ?? "" },
  );
}

function handleAdminAddUserToGroup(req, res, payload) {
  const user = findUserByUsername(payload.Username);
  if (user) {
    user.Groups = user.Groups ?? [];
    if (!user.Groups.includes(payload.GroupName)) {
      user.Groups.push(payload.GroupName);
    }
  }

  console.log(
    `[admin-add-user-to-group] ${sanitizeForLog(payload.Username)} -> ${sanitizeForLog(payload.GroupName)}`,
  );

  writeJson(res, 200, {}, {
    "x-amz-target": req.headers["x-amz-target"] ?? "",
  });
}

function handleAdminUpdateUserAttributes(req, res, payload) {
  const user = findUserByUsername(payload.Username);
  if (user) {
    user.Attributes = user.Attributes ?? [];
    for (const attribute of payload.UserAttributes ?? []) {
      const existing = user.Attributes.find((a) => a.Name === attribute.Name);
      if (existing) {
        existing.Value = attribute.Value;
      } else {
        user.Attributes.push(attribute);
      }
    }
    user.UserLastModifiedDate = NOW_IN_SECONDS;
  }

  console.log(
    `[admin-update-user-attributes] ${sanitizeForLog(payload.Username)} in pool ${sanitizeForLog(payload.UserPoolId ?? DEFAULT_USER_POOL_ID)}`,
  );

  writeJson(res, 200, {}, {
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

      if (target === "AWSCognitoIdentityProviderService.AdminDisableUser") {
        handleAdminDisableUser(req, res, payload);
        return;
      }

      if (target === "AWSCognitoIdentityProviderService.CreateGroup") {
        handleCreateGroup(req, res, payload);
        return;
      }

      if (target === "AWSCognitoIdentityProviderService.AdminCreateUser") {
        handleAdminCreateUser(req, res, payload);
        return;
      }

      if (target === "AWSCognitoIdentityProviderService.AdminAddUserToGroup") {
        handleAdminAddUserToGroup(req, res, payload);
        return;
      }

      if (
        target ===
        "AWSCognitoIdentityProviderService.AdminUpdateUserAttributes"
      ) {
        handleAdminUpdateUserAttributes(req, res, payload);
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
