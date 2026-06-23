import { KnodeId } from "@knodia/common-models/ids";

import {
  type API_ErdsIdentifier,
  type API_ErdsMetadata,
  type API_ErdsRecipientIdentifier,
} from "../models/api.ts";
import {
  POC_UC03_RELAY_LYNX_MOCK_ESERVICE_ID,
  POC_UC03_RELAY_ORION_MOCK_ESERVICE_ID,
} from "../pocUc03/mockup.ts";

// Recipient identifier (notation + scheme) -> serving SERC.
const ERDS_LOOKUP: readonly {
  erdsIdentifier: API_ErdsIdentifier;
  notation: string;
  schemeURI: API_ErdsRecipientIdentifier["schemeURI"];
}[] = [
  {
    erdsIdentifier: "systemSERCOrion",
    notation: "01229430085",
    schemeURI: "http://memberstate.ms/VAT",
  },
  {
    erdsIdentifier: "systemSERCLynx",
    notation: "MRARSS80A01L259A",
    schemeURI: "http://memberstate.ms/PIdentifier",
  },
];

const ERDS_METADATA: Record<API_ErdsIdentifier, API_ErdsMetadata> = {
  systemSERCLynx: {
    domainName: "systemSERCLynx",
    eserviceId: POC_UC03_RELAY_LYNX_MOCK_ESERVICE_ID,
    identifier: "systemSERCLynx",
    knodeId: KnodeId.enum.Lynx,
  },
  systemSERCOrion: {
    domainName: "systemSERCOrion",
    eserviceId: POC_UC03_RELAY_ORION_MOCK_ESERVICE_ID,
    identifier: "systemSERCOrion",
    knodeId: KnodeId.enum.Orion,
  },
};

export function getErdsMetadata(
  identifier: API_ErdsIdentifier,
): API_ErdsMetadata {
  return ERDS_METADATA[identifier];
}

export function lookupErds(
  recipient: Pick<API_ErdsRecipientIdentifier, "notation" | "schemeURI">,
): API_ErdsIdentifier | undefined {
  return ERDS_LOOKUP.find(
    (e) =>
      e.notation === recipient.notation && e.schemeURI === recipient.schemeURI,
  )?.erdsIdentifier;
}
