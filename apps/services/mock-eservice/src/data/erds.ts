import { type KnodeId } from "@knodia/common-models/ids";
import z from "zod";

import { API_ErdsIdentifier, type API_ErdsMetadata } from "../models/api.ts";
import {
  POC_UC03_RELAY_LYNX_MOCK_ESERVICE_ID,
  POC_UC03_RELAY_ORION_MOCK_ESERVICE_ID,
} from "../pocUc03Erds/mockup.ts";

// Recipient identifier (notation, e.g. a VAT or fiscal code) -> the SERC that
// serves it. Validated at load. The sample recipient 01229430085 is served by
// systemSERCOrion (the demo direction Lynx -> Orion).
const ErdsLookup = z.record(z.string(), API_ErdsIdentifier);
const ERDS_LOOKUP = ErdsLookup.parse({
  "01229430085": API_ErdsIdentifier.enum.systemSERCOrion,
  MRARSS80A01L259A: API_ErdsIdentifier.enum.systemSERCLynx,
});

// Static per-SERC metadata. `domainName` (the relay base URL) is environment
// specific and resolved from config at request time, so it is not stored here.
interface ErdsStaticMetadata {
  eserviceId: string;
  knodeId: KnodeId;
}
const ERDS_METADATA: Record<API_ErdsIdentifier, ErdsStaticMetadata> = {
  systemSERCLynx: {
    eserviceId: POC_UC03_RELAY_LYNX_MOCK_ESERVICE_ID,
    knodeId: "Lynx",
  },
  systemSERCOrion: {
    eserviceId: POC_UC03_RELAY_ORION_MOCK_ESERVICE_ID,
    knodeId: "Orion",
  },
};

export function lookupErds(notation: string): API_ErdsIdentifier | undefined {
  return ERDS_LOOKUP[notation];
}

export function getErdsMetadata(
  identifier: API_ErdsIdentifier,
  relayBaseUrlByErds: Record<API_ErdsIdentifier, string>,
): API_ErdsMetadata {
  const metadata = ERDS_METADATA[identifier];
  return {
    domainName: relayBaseUrlByErds[identifier],
    eserviceId: metadata.eserviceId,
    identifier,
    knodeId: metadata.knodeId,
  };
}
