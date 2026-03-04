import {
  NavbarBrand,
  NavbarUserMenu,
  Navbar as UINavbar,
} from "@knodia/ui-kit/layout";
import { MenuItem } from "@knodia/ui-kit/ui";

import { useAuth } from "@/contexts/auth";

export function Navbar() {
  const { logout } = useAuth();

  const handleLogout = () => {
    void logout();
  };

  return (
    <UINavbar>
      <NavbarBrand>Orion Knode</NavbarBrand>
      <NavbarUserMenu
        avatar={{ fallback: "JS" }}
        name="John Smith"
        role="Administrative"
      >
        <MenuItem>Edit Profile</MenuItem>
        <MenuItem>Settings</MenuItem>
        <MenuItem onAction={handleLogout}>Logout</MenuItem>
      </NavbarUserMenu>
    </UINavbar>
  );
}
