import { Chip } from "@knodia/ui-kit/ui";
import { ArrowsInIcon, ArrowsOutIcon } from "@phosphor-icons/react";
import { match } from "ts-pattern";

import type { EserviceMode } from "../types";

export function EserviceModeChip({ mode }: { mode: EserviceMode }) {
  return match(mode)
    .with("ProvideData", () => (
      <Chip
        icon={<ArrowsOutIcon />}
        kind="informative"
        label="Provide data"
        type="light"
      />
    ))
    .with("ReceiveData", () => (
      <Chip
        icon={<ArrowsInIcon />}
        kind="informative"
        label="Receive data"
        type="light"
      />
    ))
    .exhaustive();
}
