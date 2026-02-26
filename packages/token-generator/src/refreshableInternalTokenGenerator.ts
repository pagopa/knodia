import type { InternalToken } from "./models.ts";

import {
  type InternalTokenInput,
  type TokenGenerator,
  tokenGeneratorBuilder,
} from "./tokenGenerator.ts";

const REFRESH_BEFORE_EXP_SECONDS = 30;

export type RefreshableInternalTokenGenerator = ReturnType<
  typeof refreshableInternalTokenGenerator
>;

export function refreshableInternalTokenGenerator(
  input: InternalTokenInput,
  tokenGenerator?: TokenGenerator,
) {
  const generator = tokenGenerator ?? tokenGeneratorBuilder();
  let token: InternalToken | null = null;

  function shouldRefresh(exp: number): boolean {
    return exp < Date.now() / 1000 + REFRESH_BEFORE_EXP_SECONDS;
  }

  return {
    async get(): Promise<InternalToken> {
      if (!token || shouldRefresh(token.payload.exp)) {
        token = await generator.generateInternalToken(input);
      }
      return token;
    },
  };
}
