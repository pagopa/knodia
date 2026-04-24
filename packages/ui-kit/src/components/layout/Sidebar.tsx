import { type Icon } from "@phosphor-icons/react";
import { useId } from "react";
import {
  composeRenderProps,
  Link,
  type LinkProps,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";

import { listItemStyles } from "../ui/styles";

interface SidebarNavItemProps extends LinkProps {
  children?: React.ReactNode;
  Icon?: Icon;
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

export function SidebarNavItem({
  children,
  Icon,
  isCurrent,
  ...props
}: SidebarNavItemProps) {
  return (
    <li>
      <Link
        {...props}
        className={composeRenderProps(
          props.className,
          (className, renderProps) =>
            listItemStyles({
              ...renderProps,
              isSelected: isCurrent,
              className,
            }),
        )}
      >
        {Icon && (
          <>
            <Icon className="orion-only" />
            <Icon className="lynx-only" weight="duotone" />
          </>
        )}
        {children}
      </Link>
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
      <ul className="flex flex-col gap-1" role="list">
        {children}
      </ul>
    </nav>
  );
}
