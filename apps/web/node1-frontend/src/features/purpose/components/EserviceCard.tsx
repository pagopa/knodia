import type { bffApi } from "@knodia/bff-client";
import type { ReactNode } from "react";

import { SettingsCard } from "@/components/SettingCard";
import { EserviceStateChip } from "@/features/e-service/components/EserviceStateChip";

export function EserviceCard({
  eservice,
  link,
}: {
  eservice: bffApi.PurposeDetailsEservice;
  link: ReactNode;
}) {
  return (
    <SettingsCard label="E-Service">
      <span className="flex items-center gap-6">
        {link}
        <EserviceStateChip state={eservice.latestVersionState} />
      </span>
    </SettingsCard>
  );
}
