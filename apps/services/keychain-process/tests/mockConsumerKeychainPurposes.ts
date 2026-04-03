import { type ConsumerKeychainPurpose } from "@knodia/keychain-models";
import {
  getMockConsumerKeychain,
  getMockConsumerKeychainPurpose,
} from "@knodia/test-commons/utils";

export const consumerKeychain1 = getMockConsumerKeychain();
export const consumerKeychain2 = getMockConsumerKeychain(1);
export const mockConsumerKeychainPurposes: ConsumerKeychainPurpose[] = [
  {
    ...getMockConsumerKeychainPurpose(0),
    consumerKeychainId: consumerKeychain1.id,
  },
  {
    ...getMockConsumerKeychainPurpose(1),
    consumerKeychainId: consumerKeychain1.id,
  },
  {
    ...getMockConsumerKeychainPurpose(2),
    consumerKeychainId: consumerKeychain1.id,
  },
  {
    ...getMockConsumerKeychainPurpose(3),
    consumerKeychainId: consumerKeychain1.id,
  },
  {
    ...getMockConsumerKeychainPurpose(4),
    consumerKeychainId: consumerKeychain1.id,
  },
  {
    ...getMockConsumerKeychainPurpose(5),
    consumerKeychainId: consumerKeychain2.id,
  },
];
