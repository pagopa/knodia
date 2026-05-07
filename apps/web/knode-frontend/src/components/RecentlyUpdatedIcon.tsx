import { InteractiveIcon, Tooltip } from "@knodia/ui-kit/ui";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { TooltipTrigger } from "react-aria-components";

export function RecentlyUpdatedIcon() {
  return (
    <TooltipTrigger>
      <InteractiveIcon aria-label="Recent update" excludeFromTabOrder>
        <WarningCircleIcon
          aria-hidden
          className="size-6 text-info-light-low-contrast"
          weight="fill"
        />
      </InteractiveIcon>
      <Tooltip>Recent update</Tooltip>
    </TooltipTrigger>
  );
}
