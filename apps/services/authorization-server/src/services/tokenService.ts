export function tokenServiceBuilder() {
  return {
    async issueToken() {
      // TODO remove this mock implementation when the authorization server issues real tokens.
      return {
        mockAccessToken: "mock-access-token",
      };
    },
  };
}
