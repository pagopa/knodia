import { Tooltip } from "@knodia/ui-kit/ui";
import { LockIcon } from "@phosphor-icons/react";
import { Focusable, TooltipTrigger } from "react-aria-components";

export function DeclaredByProducerTooltip() {
  return (
    <TooltipTrigger delay={0}>
      <Focusable>
        <LockIcon aria-label="Declared by Producer" tabIndex={0} />
      </Focusable>
      <Tooltip>Declared by Producer</Tooltip>
    </TooltipTrigger>
  );
}
