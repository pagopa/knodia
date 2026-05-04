import {
  NavbarBrand,
  NavbarUserMenu,
  Navbar as UINavbar,
} from "@knodia/ui-kit/layout";
import { MenuItem } from "@knodia/ui-kit/ui";

import { config } from "@/config/config";
import { useAuth } from "@/contexts/auth";
import { getInitials } from "@/utils/getInitials";

export function Navbar() {
  const { logout, roles, username } = useAuth();

  const handleLogout = () => {
    void logout();
  };

  if (!username) return null;

  const initials = getInitials(username);
  const displayRole = roles
    .map((r) => r.charAt(0).toUpperCase() + r.slice(1))
    .join(", ");

  return (
    <UINavbar>
      <NavbarBrand>{config.knodeId} Knode</NavbarBrand>
      <NavbarUserMenu
        avatar={{ fallback: initials }}
        name={username}
        role={roles.length > 0 ? displayRole : undefined}
      >
        <MenuItem onAction={handleLogout}>Logout</MenuItem>
      </NavbarUserMenu>
    </UINavbar>
  );
}
