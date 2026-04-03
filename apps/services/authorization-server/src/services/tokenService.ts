export function tokenServiceBuilder() {
  return {
    issueToken: async () =>
      // TODO remove this mock implementation when the authorization server issues real tokens.
      ({
        access_token: "mock-access-token",
        expires_in: 300,
        token_type: "Bearer",
      }),
  };
}
