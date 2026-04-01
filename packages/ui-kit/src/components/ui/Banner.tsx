import type { HTMLAttributes, ReactNode } from "react";

import {
  CheckSquareIcon,
  InfoIcon,
  WarningDiamondIcon,
  XIcon,
} from "@phosphor-icons/react";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr";
import { tv, type VariantProps } from "tailwind-variants";

import { Button } from "./Button";

const banner = tv({
  base: "flex rounded-lg w-full",
  variants: {
    kind: {
      informative: "bg-info-light",
      success: "bg-success-light",
      warning: "bg-warning-light",
      error: "bg-error-light",
      neutral: "bg-secondary-light",
    },
    size: {
      sm: "items-center gap-4 px-4 py-3",
      md: "flex-col gap-2 p-4",
    },
  },
  defaultVariants: {
    kind: "informative",
    size: "sm",
  },
});

const bannerIcon = tv({
  base: "shrink-0 [&_svg]:size-6",
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

const bannerTitle = tv({
  base: "title-sm-em flex-1",
  variants: {
    kind: {
      informative: "text-info-light-high-contrast",
      success: "text-success-light-high-contrast",
      warning: "text-warning-light-high-contrast",
      error: "text-error-light-high-contrast",
      neutral: "text-secondary-light-high-contrast",
    },
  },
});

interface BannerAction {
  isDisabled?: boolean;
  label: string;
  onPress?: () => void;
}

type BannerKind = VariantProps<typeof banner>["kind"];

interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  action?: BannerAction;
  icon?: ReactNode;
  kind?: BannerKind;
  onDismiss?: () => void;
  prominentAction?: BannerAction;
  size?: "md" | "sm";
  title?: string;
}

export function Banner({
  kind = "informative",
  size = "sm",
  title,
  icon,
  action,
  prominentAction,
  onDismiss,
  className,
  children,
  role,
  ...props
}: BannerProps) {
  const resolvedRole = role ?? (kind === "error" ? "alert" : "status");

  return (
    <div
      {...props}
      className={banner({ kind, size, className })}
      role={resolvedRole}
    >
      {size === "sm" ? (
        <SmallBanner
          action={action}
          icon={icon}
          kind={kind}
          onDismiss={onDismiss}
          prominentAction={prominentAction}
        >
          {children}
        </SmallBanner>
      ) : (
        <MediumBanner
          action={action}
          icon={icon}
          kind={kind}
          onDismiss={onDismiss}
          prominentAction={prominentAction}
          title={title}
        >
          {children}
        </MediumBanner>
      )}
    </div>
  );
}

function BannerActions({
  action,
  prominentAction,
}: {
  action?: BannerAction;
  prominentAction?: BannerAction;
}) {
  if (!action && !prominentAction) return null;

  return (
    <>
      {action && (
        <Button
          hierarchy="neutral"
          isDisabled={action.isDisabled}
          kind="outlined"
          onPress={action.onPress}
          size="sm"
        >
          {action.label}
        </Button>
      )}
      {prominentAction && (
        <Button
          hierarchy="neutral"
          isDisabled={prominentAction.isDisabled}
          kind="filled"
          onPress={prominentAction.onPress}
          size="sm"
        >
          {prominentAction.label}
        </Button>
      )}
    </>
  );
}

function DefaultBannerIcon({ kind }: { kind: BannerKind }) {
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

function DismissButton({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Button
      aria-label="Dismiss"
      className="p-0"
      hierarchy="neutral"
      kind="ghost"
      onPress={onDismiss}
      size="icon-sm"
    >
      <XIcon />
    </Button>
  );
}

function MediumBanner({
  kind,
  title,
  icon,
  action,
  prominentAction,
  onDismiss,
  children,
}: {
  action?: BannerAction;
  children?: ReactNode;
  icon?: ReactNode;
  kind: BannerKind;
  onDismiss?: () => void;
  prominentAction?: BannerAction;
  title?: string;
}) {
  return (
    <>
      <div className="flex w-full items-start gap-4">
        <div className="flex flex-1 items-center gap-2">
          <span aria-hidden className={bannerIcon({ kind })}>
            {icon ?? <DefaultBannerIcon kind={kind} />}
          </span>
          {title && <p className={bannerTitle({ kind })}>{title}</p>}
        </div>
        {onDismiss && <DismissButton onDismiss={onDismiss} />}
      </div>
      {children && (
        <div className="body-md text-secondary-light-mid-contrast pl-8">
          {children}
        </div>
      )}
      {(action || prominentAction) && (
        <div className="flex gap-4 self-end">
          <BannerActions action={action} prominentAction={prominentAction} />
        </div>
      )}
    </>
  );
}

function SmallBanner({
  kind,
  icon,
  action,
  prominentAction,
  onDismiss,
  children,
}: {
  action?: BannerAction;
  children?: ReactNode;
  icon?: ReactNode;
  kind: BannerKind;
  onDismiss?: () => void;
  prominentAction?: BannerAction;
}) {
  return (
    <>
      <span aria-hidden className={bannerIcon({ kind })}>
        {icon ?? <DefaultBannerIcon kind={kind} />}
      </span>
      <div className="body-md text-secondary-light-mid-contrast flex-1">
        {children}
      </div>
      <BannerActions action={action} prominentAction={prominentAction} />
      {onDismiss && <DismissButton onDismiss={onDismiss} />}
    </>
  );
}
