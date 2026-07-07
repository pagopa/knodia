// Token types supported by generate-token.mjs.
// Add new token types here — they'll be picked up by both
// generate-token.mjs (validation) and generate-all-tokens.mjs (iteration).
export const TOKEN_TYPES = [
  "ui-session",
  "internal",
  "maintenance",
  "external-ui-session",
  "knode-api",
  "ui-signup-session",
];

// Tokens for the signup domain, which sits outside the knodes: type -> KMS key
// name. On dev these are knode-neutral and target the dev-signup env.
export const SIGNUP_DOMAIN_KEY_NAMES = {
  maintenance: "maintenance",
  "ui-signup-session": "ui-session",
};
