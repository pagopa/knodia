import {
  NavbarBrand,
  NavbarUserMenu,
  Navbar as UINavbar,
} from "@knodia/ui-kit/layout";
import { MenuItem } from "@knodia/ui-kit/ui";

import { config } from "@/config/config";
import { useAuth } from "@/contexts/auth";

export function Navbar() {
  const { logout, roles, username } = useAuth();

  const displayName = username ?? "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const displayRole = roles
    .map((r) => r.charAt(0).toUpperCase() + r.slice(1))
    .join(", ");

  const handleLogout = () => {
    void logout();
  };

  return (
    <UINavbar>
      <NavbarBrand>{config.knodeId} Knode</NavbarBrand>
      <NavbarUserMenu
        avatar={{ fallback: initials }}
        name={displayName}
        role={roles.length > 0 ? displayRole : undefined}
      >
        <MenuItem onAction={handleLogout}>Logout</MenuItem>
      </NavbarUserMenu>
    </UINavbar>
  );
}
