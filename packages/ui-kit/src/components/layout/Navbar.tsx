import { CaretDownIcon } from "@phosphor-icons/react";
import { twMerge } from "tailwind-merge";

import { Avatar, type AvatarProps, InteractiveIcon } from "../ui";
import { Menu, MenuTrigger } from "../ui/Menu";

type NavbarProps = React.ComponentPropsWithoutRef<"nav">;

interface NavbarUserMenuProps {
  avatar: AvatarProps;
  children?: React.ReactNode;
  menuAriaLabel?: string;
  name: React.ReactNode;
  role?: React.ReactNode;
}

export function Navbar({ className, children, ...props }: NavbarProps) {
  return (
    <nav {...props} className={twMerge("bg-brand-dark px-6 py-4", className)}>
      <div className="flex items-center justify-between">{children}</div>
    </nav>
  );
}

export function NavbarBrand({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div {...props} className={twMerge("min-w-0", className)}>
      <span className="text-white font-semibold text-lg headline-sm-em truncate">
        {children}
      </span>
    </div>
  );
}

export function NavbarUserMenu({
  name,
  role,
  avatar,
  menuAriaLabel = "Open profile menu",
  children,
}: NavbarUserMenuProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        <Avatar {...avatar} />
        <div className="min-w-0">
          <p className="text-brand-dark-high-contrast truncate label-md">
            {name}
          </p>
          {role && (
            <p className="text-brand-dark-mid-contrast truncate body-sm">
              {role}
            </p>
          )}
        </div>
      </div>

      <MenuTrigger>
        <InteractiveIcon aria-label={menuAriaLabel} hierarchy="inverse">
          <CaretDownIcon />
        </InteractiveIcon>

        <Menu>{children}</Menu>
      </MenuTrigger>
    </div>
  );
}
