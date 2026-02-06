import { Eservice } from "@knodia/eservice-models";
import { zocker } from "zocker";

export function getMockEservice(): Eservice {
  return zocker(Eservice)
    .array({
      min: 1,
    })
    .setSeed(0)
    .generate();
}
