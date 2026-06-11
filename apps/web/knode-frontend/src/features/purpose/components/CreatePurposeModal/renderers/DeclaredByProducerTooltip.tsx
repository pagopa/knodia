import { Tooltip } from "@knodia/ui-kit/ui";
import { InfoIcon } from "@phosphor-icons/react";
import { Focusable, TooltipTrigger } from "react-aria-components";

export function DeclaredByProducerTooltip() {
  return (
    <TooltipTrigger>
      <Focusable>
        <InfoIcon aria-label="Declared by Producer" />
      </Focusable>
      <Tooltip>Declared by Producer</Tooltip>
    </TooltipTrigger>
  );
}
