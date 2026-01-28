import type { HTMLAttributes, ReactNode } from "react";

import {
  CheckSquareIcon,
  InfoIcon,
  WarningDiamondIcon,
} from "@phosphor-icons/react";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr";
import { tv, type VariantProps } from "tailwind-variants";

const banner = tv({
  base: "body-md flex items-center gap-4 rounded-lg px-4 py-3 text-secondary-light-mid-contrast w-full",
  variants: {
    kind: {
      informative: "bg-info-light",
      success: "bg-success-light",
      warning: "bg-warning-light",
      error: "bg-error-light",
      neutral: "bg-secondary-light",
    },
  },
  defaultVariants: {
    kind: "informative",
  },
});

interface BannerProps extends BannerVariants, HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
}

type BannerVariants = VariantProps<typeof banner>;

export function Banner({
  kind = "informative",
  icon,
  className,
  children,
  role,
  ...props
}: BannerProps) {
  const resolvedRole = role ?? (kind === "error" ? "alert" : "status");

  return (
    <div {...props} className={banner({ kind, className })} role={resolvedRole}>
      <span aria-hidden className={bannerIcon({ kind })}>
        {icon ?? <DefaultBannerIcon kind={kind} />}
      </span>
      <div>{children}</div>
    </div>
  );
}

const bannerIcon = tv({
  base: "shrink-0 [&_svg]:size-5",
  variants: {
    kind: {
      informative: "text-info-light-low-contrast",
      success: "text-success-light-low-contrast",
      warning: "text-warning-light-low-contrast",
      error: "text-error-light-low-contrast",
      neutral: "text-secondary-light-low-contrast",
    },
  },
});

function DefaultBannerIcon({ kind }: { kind: BannerVariants["kind"] }) {
  switch (kind) {
    case "error":
      return <WarningDiamondIcon />;
    case "success":
      return <CheckSquareIcon />;
    case "warning":
      return <WarningIcon />;
    case "informative":
    case "neutral":
    default:
      return <InfoIcon />;
  }
}
