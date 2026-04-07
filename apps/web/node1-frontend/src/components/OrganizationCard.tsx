import type { bffApi } from "@knodia/bff-client";

import { OrganizationContactPopover } from "@/components/OrganizationContactPopover";
import { SettingsCard } from "@/components/SettingCard";

export function OrganizationCard({
  label,
  organization,
  showContact,
}: {
  label: string;
  organization: bffApi.CompactOrganization;
  showContact: boolean;
}) {
  const organizationLabel = `${organization.name} - ${organization.knodeId} Knode`;

  if (!showContact) {
    return <SettingsCard label={label}>{organizationLabel}</SettingsCard>;
  }

  return (
    <SettingsCard label={label}>
      <span className="flex items-center gap-2">
        {organizationLabel}
        {/* TODO: Replace mocked contact info with real data from the API when available */}
        <OrganizationContactPopover
          email="contact@example.com"
          knodeId={organization.knodeId}
          name={organization.name}
          notes="—"
        />
      </span>
    </SettingsCard>
  );
}
