import type { InternalToken } from "./models.ts";

import {
  type InternalTokenInput,
  type tokenGeneratorBuilder,
} from "./tokenGenerator.ts";

const REFRESH_BEFORE_EXP_SECONDS = 30;

export function refreshableInternalTokenGenerator(
  tokenGenerator: ReturnType<typeof tokenGeneratorBuilder>,
  input: InternalTokenInput,
) {
  let token: InternalToken | null = null;

  function shouldRefresh(exp: number): boolean {
    return exp < Date.now() / 1000 + REFRESH_BEFORE_EXP_SECONDS;
  }

  return {
    async get(): Promise<InternalToken> {
      if (!token || shouldRefresh(token.payload.exp)) {
        token = await tokenGenerator.generateInternalToken(input);
      }
      return token;
    },
  };
}
