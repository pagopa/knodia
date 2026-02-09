import {
  SidebarHeader,
  SidebarNavItem,
  SidebarSection,
  Sidebar as UISidebar,
} from "@knodia/ui-kit/layout";
import {
  GearIcon,
  HandshakeIcon,
  type Icon,
  KeyIcon,
  ListBulletsIcon,
  TargetIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import {
  createLink,
  type LinkProps,
  useLocation,
} from "@tanstack/react-router";

interface SidebarItem {
  Icon: Icon;
  label: string;
  to: NonNullable<LinkProps["to"]>;
}

interface SidebarSection {
  items: SidebarItem[];
  title: null | string;
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    items: [
      {
        Icon: ListBulletsIcon,
        label: "Details and attributes",
        to: "/details-and-attributes",
      },
      { Icon: UsersThreeIcon, label: "Operators", to: "/operators" },
      { Icon: KeyIcon, label: "Keychains", to: "/keychains" },
    ],
    title: null,
  },
  {
    items: [
      { Icon: GearIcon, label: "E-Services", to: "/production/e-services" },
      {
        Icon: HandshakeIcon,
        label: "Agreements",
        to: "/production/agreements",
      },
      { Icon: TargetIcon, label: "Purposes", to: "/production/purposes" },
    ],
    title: "production",
  },
  {
    items: [
      { Icon: GearIcon, label: "E-Services", to: "/consumption/e-services" },
      {
        Icon: HandshakeIcon,
        label: "Agreements",
        to: "/consumption/agreements",
      },
      { Icon: TargetIcon, label: "Purposes", to: "/consumption/purposes" },
    ],
    title: "consumption",
  },
];

/**
 * To make preloading work with SidebarNavItem.
 */
const SidebarNavItemLink = createLink(SidebarNavItem);

export function Sidebar() {
  const location = useLocation();

  return (
    <UISidebar>
      <SidebarHeader>Rigel Org</SidebarHeader>
      {SIDEBAR_SECTIONS.map((section, idx) => (
        <SidebarSection key={idx} title={section.title}>
          {section.items.map((item) => (
            <SidebarNavItemLink
              isCurrent={location.pathname.startsWith(item.to)}
              key={`${item.to}-${item.label}`}
              to={item.to}
            >
              <item.Icon />
              {item.label}
            </SidebarNavItemLink>
          ))}
        </SidebarSection>
      ))}
    </UISidebar>
  );
}
