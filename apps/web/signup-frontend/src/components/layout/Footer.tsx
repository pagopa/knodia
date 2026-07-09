import { Fragment } from "react";

import euFlag from "@/assets/eu-flag.svg";
import knodiaLogoWhite from "@/assets/knodia-logo-white.svg";
import logoDtdExtended from "@/assets/logo-dtd-extended.svg";
import logoPagopa from "@/assets/logo-pagopa.svg";
import { Link } from "@/components/ui";
import {
  PRIVACY_POLICY_PATH,
  TERMS_AND_CONDITIONS_PATH,
} from "@/config/legalLinks";

const LEGAL_LINKS = [
  { href: PRIVACY_POLICY_PATH, label: "Privacy Policy" },
  { href: TERMS_AND_CONDITIONS_PATH, label: "Terms and Conditions" },
  // TODO: restore Company Details (config.knodiaOrgCompanyDetailsUrl) after the demo.
];

// Amber focus ring (the footer accent): primary-violet on the deep-violet footer is below the WCAG 3:1 threshold.
const LOGO_LINK_CLASS =
  "inline-block rounded-sm outline-secondary-muted-amber outline-offset-2 hover:opacity-80 focus-visible:outline-2 forced-colors:focus-visible:outline-[Highlight]";

const PARTNER_LOGOS = [
  {
    alt: "Logo Dipartimento per la trasformazione digitale",
    href: "https://innovazione.gov.it/",
    imgClassName: "h-[30px] w-auto",
    src: logoDtdExtended,
    title: "Go to Dipartimento per la trasformazione digitale website",
  },
  {
    alt: "Logo PagoPA S.p.A.",
    href: "https://www.pagopa.it/en/homepage/",
    // logo-pagopa.svg has preserveAspectRatio="none" + width/height 100%, so it needs an explicit width.
    imgClassName: "h-[30px] w-[107px]",
    src: logoPagopa,
    title: "Go to PagoPA S.p.A. website",
  },
];

export function Footer() {
  return (
    <footer className="w-full bg-deep-violet pt-[60px] pb-12">
      <div className="mx-auto flex w-full max-w-(--header-shell-max) items-start justify-between px-(--header-inline-padding)">
        <div className="flex h-[210px] flex-col justify-between">
          <img
            alt="Knodia"
            className="h-(--header-logo-height) w-(--header-logo-width)"
            src={knodiaLogoWhite}
          />
          <div className="flex items-center gap-6 text-neutral-white">
            <span className="font-body text-[14px] leading-[20px] font-normal tracking-[0.35px] uppercase">
              © 2026 Knodia
            </span>
            <div className="text-style-caption flex items-center gap-3">
              {LEGAL_LINKS.map((link, index) => (
                <Fragment key={link.href}>
                  {index > 0 && <span aria-hidden>·</span>}
                  <Link
                    className="font-medium tracking-normal text-[14px] leading-[20px] text-neutral-white no-underline outline-secondary-muted-amber hover:text-secondary-muted-amber"
                    href={link.href}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {link.label}
                  </Link>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-[66px]">
          <LogoLink
            alt="Logo NextGenerationEU"
            href="https://commission.europa.eu/index_en"
            imgClassName="w-[219px]"
            src={euFlag}
            title="Go to EU Commission website"
          />
          <div className="flex flex-col gap-4">
            <span className="text-style-caption text-neutral-gray-40">
              PARTNERS
            </span>
            <div className="flex flex-col items-start gap-4">
              {PARTNER_LOGOS.map((logo) => (
                <LogoLink key={logo.href} {...logo} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function LogoLink({
  alt,
  href,
  imgClassName,
  src,
  title,
}: {
  alt: string;
  href: string;
  imgClassName: string;
  src: string;
  title: string;
}) {
  return (
    <a
      className={LOGO_LINK_CLASS}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
      title={title}
    >
      <img alt={alt} className={imgClassName} src={src} />
    </a>
  );
}
