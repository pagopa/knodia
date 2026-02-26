import { Eservice } from "@knodia/eservice-models";
import { Keychain } from "@knodia/keychain-models";
import { zocker } from "zocker";

export function getMockEservice(): Eservice {
  return zocker(Eservice)
    .array({
      min: 1,
    })
    .setSeed(0)
    .generate();
}

export function getMockKeychain(): Keychain {
  return zocker(Keychain)
    .array({
      min: 1,
    })
    .setSeed(0)
    .generate();
}
