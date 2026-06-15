import { Tooltip } from "@knodia/ui-kit/ui";
import { LockSimpleIcon } from "@phosphor-icons/react";
import { Focusable, TooltipTrigger } from "react-aria-components";

export function DeclaredByProducerTooltip() {
  return (
    <TooltipTrigger delay={0}>
      <Focusable>
        <LockSimpleIcon
          aria-label="Declared by Producer"
          tabIndex={0}
          weight="bold"
        />
      </Focusable>
      <Tooltip>Declared by Producer</Tooltip>
    </TooltipTrigger>
  );
}
