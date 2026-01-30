import {
  NavbarBrand,
  NavbarUserMenu,
  Navbar as UINavbar,
} from "@knodia/ui-kit/layout";
import { MenuItem } from "@knodia/ui-kit/ui";

export function Navbar() {
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
        <MenuItem>Logout</MenuItem>
      </NavbarUserMenu>
    </UINavbar>
  );
}
