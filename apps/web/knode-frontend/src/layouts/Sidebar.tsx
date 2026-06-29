import {
  SidebarHeader,
  SidebarNavItem,
  SidebarSection,
  Sidebar as UISidebar,
} from "@knodia/ui-kit/layout";
import { Link } from "@knodia/ui-kit/ui";
import {
  GearIcon,
  HandshakeIcon,
  type Icon,
  KeyIcon,
  ListBulletsIcon,
  TargetIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import {
  createLink,
  type LinkProps,
  useLocation,
} from "@tanstack/react-router";
import { Fragment } from "react";

import { config } from "@/config/config";
import { sessionOrganizationQuery } from "@/features/session/services/queries";

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

const LEGAL_LINKS = [
  { href: config.privacyPolicyUrl, label: "Privacy Policy" },
  { href: config.termsAndConditionsUrl, label: "Terms & Conditions" },
];

export function Sidebar() {
  const location = useLocation();
  const { data: sessionOrganization } = useQuery(sessionOrganizationQuery());

  return (
    <UISidebar>
      <SidebarHeader>{sessionOrganization?.name ?? ""}</SidebarHeader>
      {SIDEBAR_SECTIONS.map((section, idx) => (
        <SidebarSection key={idx} title={section.title}>
          {section.items.map((item) => (
            <SidebarNavItemLink
              Icon={item.Icon}
              isCurrent={location.pathname.startsWith(item.to)}
              key={`${item.to}-${item.label}`}
              to={item.to}
            >
              {item.label}
            </SidebarNavItemLink>
          ))}
        </SidebarSection>
      ))}
      <SidebarLegalLinks />
    </UISidebar>
  );
}

function SidebarLegalLinks() {
  return (
    <nav
      aria-label="Legal"
      className="mt-auto label-sm text-secondary-light-low-contrast"
    >
      {LEGAL_LINKS.map((link, index) => (
        <Fragment key={link.href}>
          {index > 0 && <span aria-hidden> · </span>}
          <Link
            className="text-secondary-light-low-contrast"
            href={link.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {link.label}
          </Link>
        </Fragment>
      ))}
    </nav>
  );
}
