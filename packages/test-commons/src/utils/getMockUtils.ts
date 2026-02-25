import { Agreement } from "@knodia/agreement-models";
import { Eservice } from "@knodia/eservice-models";
import { zocker } from "zocker";

export function getMockAgreement(seed = 0): Agreement {
  return zocker(Agreement)
    .array({
      min: 1,
    })
    .setSeed(seed)
    .generate();
}

export function getMockEservice(): Eservice {
  return zocker(Eservice)
    .array({
      min: 1,
    })
    .setSeed(0)
    .generate();
}
