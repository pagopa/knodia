import { CopyButton } from "@knodia/ui-kit/ui";
import { twMerge } from "tailwind-merge";

interface CopyableValueFieldProps extends React.ComponentProps<"div"> {
  label?: string;
  prefix?: string;
  value: string;
}

export function CopyableValueField({
  className,
  label,
  prefix,
  value,
  ...props
}: CopyableValueFieldProps) {
  return (
    <div className={twMerge("flex items-center gap-4", className)} {...props}>
      <dl className="body-md flex items-center gap-2 text-primary-light-high-contrast">
        {label && <dt className="body-md-em">{label}</dt>}
        <dd className="body-md">
          {prefix}
          {value}
        </dd>
      </dl>
      <CopyButton
        aria-label={`Copy ${label ? `${label} value` : "value"}`}
        textToCopy={value}
      />
    </div>
  );
}
