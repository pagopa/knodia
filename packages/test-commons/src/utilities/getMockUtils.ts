import { Eservice } from "@knodia/eservice-models";
import { ConsumerKeychain } from "@knodia/keychain-models";
import { zocker } from "zocker";

/** @knipignore */
export function getMockConsumerKeychain(seed = 0): ConsumerKeychain {
  return zocker(ConsumerKeychain)
    .array({
      min: 1,
    })
    .setSeed(seed)
    .generate();
}

export function getMockEservice(seed = 0): Eservice {
  return zocker(Eservice)
    .array({
      min: 1,
    })
    .setSeed(seed)
    .generate();
}
