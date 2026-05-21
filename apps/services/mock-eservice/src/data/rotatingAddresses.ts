import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import { API_Address, API_Notation } from "../models/api.ts";

// Single source of truth for which fiscal codes rotate. The Signal Hub
// emitter derives `rotatingFiscalCodes` from these keys, so the producer
// HTTP side and the signal emitter can't drift.

const RotatingAddressesFile = z.record(
  API_Notation,
  z.array(API_Address.nullable()).min(1),
);

const dataDir = dirname(fileURLToPath(import.meta.url));

export const rotatingAddresses = RotatingAddressesFile.parse(
  JSON.parse(readFileSync(join(dataDir, "rotatingAddresses.json"), "utf8")),
);

export const rotatingFiscalCodes = Object.keys(rotatingAddresses);
