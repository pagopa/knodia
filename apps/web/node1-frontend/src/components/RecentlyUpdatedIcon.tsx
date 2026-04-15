import { InteractiveIcon, Tooltip } from "@knodia/ui-kit/ui";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { TooltipTrigger } from "react-aria-components";

export function RecentlyUpdatedIcon() {
  return (
    <TooltipTrigger>
      <InteractiveIcon>
        <WarningCircleIcon
          aria-label="Recently updated"
          className="size-6 text-sky-600"
          weight="fill"
        />
      </InteractiveIcon>
      <Tooltip>Recent update</Tooltip>
    </TooltipTrigger>
  );
}
