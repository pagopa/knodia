import { Agreement } from "@knodia/agreement-models";
import {
  Eservice,
  EserviceVersion,
  EserviceVersionState,
} from "@knodia/eservice-models";
import { ConsumerKeychain } from "@knodia/keychain-models";
import { zocker } from "zocker";

export function getMockAgreement(seed = 0): Agreement {
  return zocker(Agreement)
    .array({
      min: 1,
    })
    .setSeed(seed)
    .generate();
}

/** @knipignore */
export function getMockConsumerKeychain(seed = 0): ConsumerKeychain {
  return zocker(ConsumerKeychain)
    .array({
      min: 1,
    })
    .setSeed(seed)
    .generate();
}

export function getMockEservice({
  latestVersionState,
  minArrayLength = 1,
  seed = 0,
}: {
  latestVersionState?: EserviceVersionState;
  minArrayLength?: number;
  seed?: number;
} = {}): Eservice {
  return {
    ...zocker(Eservice)
      .array({
        min: minArrayLength,
      })
      .setSeed(seed)
      .generate(),
    ...(latestVersionState !== undefined
      ? {
          versions: [
            zocker(EserviceVersion)
              .array({
                min: minArrayLength,
              })
              .supply(EserviceVersion.shape.state, latestVersionState)
              .setSeed(seed)
              .generate(),
          ],
        }
      : {}),
  };
}
