import type { bffApi } from "@knodia/bff-client";

import { KnodeAvatar } from "@/components/KnodeAvatar";
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
  return (
    <SettingsCard label={label}>
      <span className="flex items-center gap-2">
        <KnodeAvatar
          className="bg-brand-dark text-white"
          knodeId={organization.knodeId}
          size="sm"
        />
        {organization.name}
        {showContact && (
          <OrganizationContactPopover organization={organization} />
        )}
      </span>
    </SettingsCard>
  );
}
