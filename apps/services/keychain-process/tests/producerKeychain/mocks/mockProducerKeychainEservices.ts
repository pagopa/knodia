import { type ProducerKeychainEservice } from "@knodia/keychain-models";
import {
  getMockProducerKeychain,
  getMockProducerKeychainEservice,
} from "@knodia/test-commons/utils";

export const producerKeychain1 = getMockProducerKeychain();
export const producerKeychain2 = getMockProducerKeychain(1);
export const mockProducerKeychainEservices: ProducerKeychainEservice[] = [
  {
    ...getMockProducerKeychainEservice(0),
    producerKeychainId: producerKeychain1.id,
  },
  {
    ...getMockProducerKeychainEservice(1),
    producerKeychainId: producerKeychain1.id,
  },
  {
    ...getMockProducerKeychainEservice(2),
    producerKeychainId: producerKeychain1.id,
  },
  {
    ...getMockProducerKeychainEservice(3),
    producerKeychainId: producerKeychain1.id,
  },
  {
    ...getMockProducerKeychainEservice(4),
    producerKeychainId: producerKeychain1.id,
  },
  {
    ...getMockProducerKeychainEservice(5),
    producerKeychainId: producerKeychain2.id,
  },
];
