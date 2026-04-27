import type { bffApi } from "@knodia/bff-client";

import { Button, Popover } from "@knodia/ui-kit/ui";
import { AddressBookIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { DialogTrigger } from "react-aria-components";

import { KnodeAvatar } from "@/components/KnodeAvatar";

// TODO: Replace mocked contact info (email and notes) with real data from the API when available
export function OrganizationContactPopover({
  organization,
}: {
  organization: bffApi.CompactOrganization;
}) {
  return (
    <DialogTrigger>
      <Button
        aria-label="View contact info"
        className="p-0"
        hierarchy="neutral"
        kind="ghost"
        size="icon-sm"
      >
        <AddressBookIcon
          className="orion-only text-primary-light-low-contrast"
          size={16}
        />
        <EnvelopeSimpleIcon
          className="lynx-only text-primary-light-low-contrast"
          size={16}
        />
      </Button>
      <Popover
        className="max-w-md"
        placement="bottom start"
        title={organization.name}
      >
        <KnodeAvatar
          className="bg-brand-dark text-white"
          knodeId={organization.knodeId}
          name={`${organization.knodeId} Knode`}
          size="sm"
        />
        <dl className="body-sm flex flex-col gap-1">
          <div className="flex gap-2">
            <dt>E-mail address:</dt>
            <dd className="body-sm-em">contact@example.com</dd>
          </div>
          <div className="flex gap-2">
            <dt>Notes:</dt>
            <dd className="body-sm-em">—</dd>
          </div>
        </dl>
      </Popover>
    </DialogTrigger>
  );
}
