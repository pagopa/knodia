import { generateId } from "@knodia/common-models/ids";

import { app } from "./setup.ts";

export const injectRequest = () =>
  app.inject().headers({
    "x-correlation-id": generateId(),
  });
