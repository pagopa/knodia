import { Button, Popover } from "@knodia/ui-kit/ui";
import { AddressBookIcon } from "@phosphor-icons/react";
import { DialogTrigger } from "react-aria-components";

export function OrganizationContactPopover({
  email,
  knodeName,
  name,
  notes,
}: {
  email: string;
  knodeName: string;
  name: string;
  notes: string;
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
          className="text-primary-light-low-contrast"
          size={16}
        />
      </Button>
      <Popover
        className="max-w-md"
        placement="bottom start"
        title={`${name} – ${knodeName} Knode`}
      >
        <dl className="body-sm flex flex-col gap-1">
          <div className="flex gap-2">
            <dt>E-mail address:</dt>
            <dd className="body-sm-em">{email}</dd>
          </div>
          <div className="flex gap-2">
            <dt>Notes:</dt>
            <dd className="body-sm-em">{notes}</dd>
          </div>
        </dl>
      </Popover>
    </DialogTrigger>
  );
}
