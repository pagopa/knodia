import {
  Navbar,
  NavbarBrand,
  NavbarUserMenu,
  Sidebar,
  SidebarHeader,
  SidebarNavItem,
  SidebarSection,
} from "@knodia/ui-kit/layout";
import { MenuItem } from "@knodia/ui-kit/ui";
import { Link, type LinkProps, useLocation } from "@tanstack/react-router";
import {
  Cog,
  Handshake,
  Key,
  List,
  type LucideIcon,
  Target,
  Users,
} from "lucide-react";

interface SidebarItem {
  Icon: LucideIcon;
  label: string;
  to: NonNullable<LinkProps["to"]>;
}

interface SidebarSection {
  items: SidebarItem[];
  title: null | string;
}

export function AppLayout({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <AppNavbar />
      <div className="flex h-[calc(100vh-72px)]">
        <AppSidebar />
        <main className="p-10 flex-1 overflow-auto">{children}</main>
      </div>
    </>
  );
}

function AppNavbar() {
  return (
    <Navbar>
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
    </Navbar>
  );
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    items: [
      {
        Icon: List,
        label: "Details and attributes",
        to: "/details-and-attributes",
      },
      { Icon: Users, label: "Operators", to: "/operators" },
      { Icon: Key, label: "Keychains", to: "/keychains" },
    ],
    title: null,
  },
  {
    items: [
      { Icon: Cog, label: "E-Services", to: "/production/e-services" },
      { Icon: Handshake, label: "Agreements", to: "/production/agreements" },
      { Icon: Target, label: "Purposes", to: "/production/purposes" },
    ],
    title: "production",
  },
  {
    items: [
      { Icon: Cog, label: "E-Services", to: "/consumption/e-services" },
      { Icon: Handshake, label: "Agreements", to: "/consumption/agreements" },
      { Icon: Target, label: "Purposes", to: "/consumption/purposes" },
    ],
    title: "consumption",
  },
];

function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader>Rigel Org</SidebarHeader>
      {SIDEBAR_SECTIONS.map((section, idx) => (
        <SidebarSection key={idx} title={section.title}>
          {section.items.map((item) => (
            <SidebarNavItem
              isCurrent={location.pathname.startsWith(item.to)}
              key={`${item.to}-${item.label}`}
            >
              <Link to={item.to}>
                <item.Icon />
                {item.label}
              </Link>
            </SidebarNavItem>
          ))}
        </SidebarSection>
      ))}
    </Sidebar>
  );
}
