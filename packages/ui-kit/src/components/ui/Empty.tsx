import type { ComponentProps, ReactNode } from "react";
import type { LinkProps } from "react-aria-components";

import {
  CheckSquareIcon,
  InfoIcon,
  PlaceholderIcon,
  WarningDiamondIcon,
} from "@phosphor-icons/react";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr";
import { tv, type VariantProps } from "tailwind-variants";

import { Button } from "./Button";
import { ButtonLink } from "./ButtonLink";

const empty = tv({
  base: "flex flex-col items-center gap-8 text-center max-w-60",
});

const emptyIconWrapper = tv({
  base: "flex items-center justify-center p-2 rounded-[10px]",
  variants: {
    kind: {
      neutral: "bg-secondary-light",
      brand: "bg-brand-light",
      informative: "bg-info-light",
      success: "bg-success-light",
      warning: "bg-warning-light",
      error: "bg-error-light",
    },
  },
  defaultVariants: {
    kind: "neutral",
  },
});

const emptyIcon = tv({
  base: "shrink-0 [&_svg]:size-6",
  variants: {
    kind: {
      neutral: "text-secondary-light-mid-contrast",
      brand: "text-brand-light-mid-contrast",
      informative: "text-info-light-mid-contrast",
      success: "text-success-light-mid-contrast",
      warning: "text-warning-light-mid-contrast",
      error: "text-error-light-mid-contrast",
    },
  },
  defaultVariants: {
    kind: "neutral",
  },
});

export interface EmptyProps
  extends EmptyVariants, Omit<ComponentProps<"div">, "title"> {
  action?: { icon?: ReactNode; label: string } & (
    | { as: "button"; onClick: () => void }
    | { as: "link"; to: LinkProps["href"] }
  );
  description?: string;
  icon?: ReactNode;
  title: string;
}

type EmptyVariants = VariantProps<typeof emptyIconWrapper>;

export function Empty({
  action,
  className,
  description,
  icon,
  kind = "neutral",
  title,
  ...props
}: EmptyProps) {
  return (
    <div {...props} className={empty({ className })}>
      <div className="flex w-full flex-col items-center gap-4">
        <div className={emptyIconWrapper({ kind })}>
          <span aria-hidden className={emptyIcon({ kind })}>
            {icon ?? <DefaultEmptyIcon kind={kind} />}
          </span>
        </div>

        <div className="flex w-full flex-col gap-1">
          <p className="title-md-em text-primary-light-high-contrast">
            {title}
          </p>
          {description && (
            <p className="body-md text-primary-light-mid-contrast">
              {description}
            </p>
          )}
        </div>
      </div>

      {action && (
        <div className="flex justify-center">
          <EmptyActionButton {...action} />
        </div>
      )}
    </div>
  );
}

function DefaultEmptyIcon({ kind }: { kind: EmptyVariants["kind"] }) {
  switch (kind) {
    case "error":
      return <WarningDiamondIcon />;
    case "informative":
      return <InfoIcon />;
    case "success":
      return <CheckSquareIcon />;
    case "warning":
      return <WarningIcon />;
    case "brand":
    case "neutral":
    default:
      return <PlaceholderIcon />;
  }
}

function EmptyActionButton({
  as,
  icon = null,
  label,
  ...props
}: NonNullable<EmptyProps["action"]>) {
  const Component = as === "button" ? Button : ButtonLink;

  return (
    <Component hierarchy="neutral" kind="outlined" size="md" {...props}>
      {label}
      {icon}
    </Component>
  );
}
