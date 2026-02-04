import { Children, cloneElement, useId } from "react";
import { twMerge } from "tailwind-merge";

import { listItemStyles } from "../ui/styles";

interface SidebarNavItemProps {
  children: React.ReactElement;
  isCurrent?: boolean;
}

type SidebarProps = React.ComponentPropsWithoutRef<"aside">;

interface SidebarSectionProps {
  children?: React.ReactNode;
  title?: null | string | undefined;
}

export function Sidebar({ children, className, ...props }: SidebarProps) {
  return (
    <aside
      {...props}
      className={twMerge(
        "bg-slate-50 p-6 flex flex-col gap-6 w-70 h-full shrink-0",
        className,
      )}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ children }: { children?: React.ReactNode }) {
  return <h2 className="title-md-em">{children}</h2>;
}

export function SidebarNavItem({ children, isCurrent }: SidebarNavItemProps) {
  const child = Children.only(children) as React.ReactElement<{
    className?: string;
  }>;

  return (
    <li>
      {cloneElement(child, {
        className: twMerge(
          listItemStyles({ isSelected: isCurrent }),
          child.props.className,
        ),
      })}
    </li>
  );
}

export function SidebarSection({ children, title }: SidebarSectionProps) {
  const labelId = useId();

  return (
    <nav aria-labelledby={title ? labelId : undefined}>
      {title && (
        <p
          className="uppercase text-primary-light-low-contrast mb-2 label-sm-em"
          id={labelId}
        >
          {title}
        </p>
      )}
      <ul className="space-y-1" role="list">
        {children}
      </ul>
    </nav>
  );
}
