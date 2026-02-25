import {
  NavbarBrand,
  NavbarUserMenu,
  Navbar as UINavbar,
} from "@knodia/ui-kit/layout";
import { MenuItem } from "@knodia/ui-kit/ui";
import { useNavigate } from "@tanstack/react-router";

import { useAuth } from "@/contexts/auth";

export function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate({ replace: true, to: "/login" });
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
