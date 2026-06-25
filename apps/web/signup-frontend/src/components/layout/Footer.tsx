import { Fragment } from "react";

import euFlag from "@/assets/eu-flag.svg";
import knodiaLogoWhite from "@/assets/knodia-logo-white.svg";
import logoD from "@/assets/logo-d.svg";
import logoPagopa from "@/assets/logo-pagopa.svg";
import { Link } from "@/components/ui";
import { APP_BASE_PATH } from "@/config/basepath";
import { config } from "@/config/config";

const LEGAL_LINKS = [
  { href: `${APP_BASE_PATH}/privacy-policy`, label: "Privacy Policy" },
  { href: config.knodiaOrgLegalNotesUrl, label: "Legal Notes" },
  { href: config.knodiaOrgCompanyDetailsUrl, label: "Company Details" },
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
        <div className="flex w-[219px] flex-col gap-[66px]">
          <img
            alt="Funded by the European Union – NextGenerationEU"
            className="w-[219px]"
            src={euFlag}
          />
          <div className="flex flex-col gap-4">
            <span className="text-style-caption text-neutral-gray-40">
              PARTNERS
            </span>
            <div className="flex items-center justify-between">
              <img
                alt="PagoPA"
                className="h-[30px] w-[107px]"
                src={logoPagopa}
              />
              <img alt="Dipartimento" className="size-[50px]" src={logoD} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
