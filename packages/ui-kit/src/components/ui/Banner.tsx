import type { HTMLAttributes, ReactNode } from "react";

import {
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  XCircleIcon,
} from "lucide-react";
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

export interface BannerProps
  extends BannerVariants, HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
}

type BannerVariants = VariantProps<typeof banner>;

const defaultIcons: Record<NonNullable<BannerVariants["kind"]>, ReactNode> = {
  informative: <InfoIcon aria-hidden="true" />,
  success: <CheckCircleIcon aria-hidden="true" />,
  warning: <AlertTriangleIcon aria-hidden="true" />,
  error: <XCircleIcon aria-hidden="true" />,
  neutral: <InfoIcon aria-hidden="true" />,
};

export function Banner({
  kind = "informative",
  icon,
  className,
  children,
  role,
  ...props
}: BannerProps) {
  const resolvedRole = role ?? (kind === "error" ? "alert" : "status");
  const resolvedIcon = icon ?? defaultIcons[kind];

  return (
    <div {...props} className={banner({ kind, className })} role={resolvedRole}>
      <span aria-hidden="true" className={bannerIcon({ kind })}>
        {resolvedIcon}
      </span>
      <p>{children}</p>
    </div>
  );
}
