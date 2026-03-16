import { ConsumerKeychain } from "@knodia/keychain-models";
import { zocker } from "zocker";

export const mockConsumerKeychains = zocker(ConsumerKeychain)
  .setSeed(0)
  .generateMany(10);
