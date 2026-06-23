import { WarningIcon } from "@/components/icons";

interface AlertProps {
  children: React.ReactNode;
}

export function Alert({ children }: AlertProps) {
  return (
    <div className="flex items-start gap-2 rounded-button border border-status-warning-border bg-status-warning-surface p-4">
      <WarningIcon className="size-6 shrink-0 text-status-warning" />
      <p className="font-caption text-[16px] leading-[22px] font-normal tracking-normal text-status-warning">
        {children}
      </p>
    </div>
  );
}
