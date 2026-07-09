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
];

const LOGO_LINK_CLASS =
  "inline-block rounded-sm outline-primary-violet outline-offset-2 hover:opacity-80 focus-visible:outline-2 forced-colors:focus-visible:outline-[Highlight]";

const PARTNER_LOGOS = [
  {
    alt: "Logo Dipartimento per la trasformazione digitale",
    className: "h-[30px] w-auto",
    href: "https://innovazione.gov.it/",
    src: logoDtdExtended,
    title: "Go to Dipartimento per la trasformazione digitale website",
  },
  {
    alt: "Logo PagoPA S.p.A.",
    className: "h-[30px] w-auto",
    href: "https://www.pagopa.it/en/homepage/",
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
                    className="font-medium tracking-normal text-[14px] leading-[20px] text-neutral-white no-underline hover:text-secondary-muted-amber"
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
          <a
            className={LOGO_LINK_CLASS}
            href="https://commission.europa.eu/index_en"
            rel="noopener noreferrer"
            target="_blank"
            title="Go to EU Commission website"
          >
            <img
              alt="Logo NextGenerationEU"
              className="w-[219px]"
              src={euFlag}
            />
          </a>
          <div className="flex flex-col gap-4">
            <span className="text-style-caption text-neutral-gray-40">
              PARTNERS
            </span>
            <div className="flex flex-col items-start gap-4">
              {PARTNER_LOGOS.map((logo) => (
                <a
                  className={LOGO_LINK_CLASS}
                  href={logo.href}
                  key={logo.href}
                  rel="noopener noreferrer"
                  target="_blank"
                  title={logo.title}
                >
                  <img
                    alt={logo.alt}
                    className={logo.className}
                    src={logo.src}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
