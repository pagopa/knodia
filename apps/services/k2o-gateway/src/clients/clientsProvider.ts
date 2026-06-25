import {
  createKeychainProcessApiClient,
  type KeychainProcessClient,
} from "@knodia/keychain-process-client";

interface KnodiaClients {
  keychainProcessClient: KeychainProcessClient;
}

export function getKnodiaClients({
  keychainProcessUrl,
}: {
  keychainProcessUrl: string;
}): KnodiaClients {
  return {
    keychainProcessClient: createKeychainProcessApiClient({
      baseURL: keychainProcessUrl,
    }),
  };
}
