import { Agreement } from "@knodia/agreement-models";
import {
  Eservice,
  EserviceVersion,
  EserviceVersionState,
} from "@knodia/eservice-models";
import { zocker } from "zocker";

export function getMockAgreement(seed = 0): Agreement {
  return zocker(Agreement)
    .array({
      min: 1,
    })
    .setSeed(seed)
    .generate();
}

export function getMockEservice({
  latestVersionState,
  maxArrayLength,
  minArrayLength = 1,
}: {
  latestVersionState?: EserviceVersionState;
  maxArrayLength?: number;
  minArrayLength?: number;
} = {}): Eservice {
  return {
    ...zocker(Eservice)
      .array({
        max: maxArrayLength,
        min: minArrayLength,
      })
      .setSeed(0)
      .generate(),
    ...(latestVersionState !== undefined
      ? {
          versions: [
            zocker(EserviceVersion)
              .array({
                max: maxArrayLength,
                min: minArrayLength,
              })
              .supply(EserviceVersion.shape.state, latestVersionState)
              .setSeed(0)
              .generate(),
          ],
        }
      : {}),
  };
}
