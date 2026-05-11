import { Tooltip } from "@knodia/ui-kit/ui";
import { LockIcon } from "@phosphor-icons/react";
import { Focusable, TooltipTrigger } from "react-aria-components";

export function DefinedByTemplateIconTooltip() {
  return (
    <TooltipTrigger>
      <Focusable>
        <LockIcon aria-label="Defined by template" />
      </Focusable>
      <Tooltip>Defined by template</Tooltip>
    </TooltipTrigger>
  );
}
