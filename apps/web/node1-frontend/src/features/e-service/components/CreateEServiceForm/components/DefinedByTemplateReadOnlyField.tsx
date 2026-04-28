import { TextField, Tooltip } from "@knodia/ui-kit/ui";
import { LockIcon } from "@phosphor-icons/react";
import { Focusable, TooltipTrigger } from "react-aria-components";

export function DefinedByTemplateReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <TextField
      endIcon={<DefinedByTemplateIconTooltip />}
      isReadOnly
      label={label}
      size="lg"
      value={value}
    />
  );
}

function DefinedByTemplateIconTooltip() {
  return (
    <TooltipTrigger>
      <Focusable>
        <LockIcon aria-label="Defined by template" />
      </Focusable>
      <Tooltip>Defined by template</Tooltip>
    </TooltipTrigger>
  );
}
