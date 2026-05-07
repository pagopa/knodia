import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

interface SettingsCardProps extends React.ComponentProps<"dl"> {
  children?: ReactNode;
  label: ReactNode;
}

export function SettingsCard({
  children,
  className,
  label,
  ...props
}: SettingsCardProps) {
  return (
    <dl
      {...props}
      className={twMerge(
        "bg-secondary-light flex flex-col gap-3 rounded-settings-card p-6",
        className,
      )}
    >
      <dt className="label-lg text-primary-light-low-contrast">{label}</dt>
      <dd className="flex w-full justify-end">
        <span className="title-md-em text-primary-light-high-contrast">
          {children}
        </span>
      </dd>
    </dl>
  );
}
