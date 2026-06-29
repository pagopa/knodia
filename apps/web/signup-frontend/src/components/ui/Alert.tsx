import { tv } from "tailwind-variants";
import { match } from "ts-pattern";

import { ReportFilledIcon, WarningIcon } from "@/components/icons";

const alertStyles = tv({
  base: "flex items-start gap-2 rounded-button border p-4",
  variants: {
    severity: {
      error:
        "items-end border-status-error-border bg-status-error-surface text-status-error-strong",
      warning:
        "border-status-warning-border bg-status-warning-surface text-status-warning",
    },
  },
});

interface AlertProps {
  children: React.ReactNode;
  severity?: "error" | "warning";
}

export function Alert({ children, severity = "warning" }: AlertProps) {
  const icon = match(severity)
    .with("warning", () => <WarningIcon className="size-6 shrink-0" />)
    .with("error", () => <ReportFilledIcon className="size-6 shrink-0" />)
    .exhaustive();

  return (
    <div
      className={alertStyles({ severity })}
      role={severity === "error" ? "alert" : undefined}
    >
      {icon}
      <p className="font-caption text-[16px] leading-[22px] font-normal tracking-normal">
        {children}
      </p>
    </div>
  );
}
