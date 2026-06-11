import euFlag from "@/assets/eu-flag.svg";
import knodiaLogoWhite from "@/assets/knodia-logo-white.svg";
import logoD from "@/assets/logo-d.svg";
import logoPagopa from "@/assets/logo-pagopa.svg";

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
          <div className="flex items-center gap-6 text-[14px] leading-[20px] text-neutral-white">
            <span className="font-body font-normal tracking-[0.35px] uppercase">
              © 2026 Knodia
            </span>
            {/* TODO: turn these into links */}
            <span className="font-body font-medium whitespace-pre">
              {`Privacy Policy   ·   Legal Notes   ·   Company Details`}
            </span>
          </div>
        </div>
        <div className="flex w-[219px] flex-col gap-[66px]">
          <div className="flex items-center gap-3">
            <img
              alt="Flag of the European Union"
              className="h-[42px] w-[63px] border border-neutral-white"
              src={euFlag}
            />
            <div className="flex flex-col font-body text-neutral-white">
              <span className="text-[12px] leading-[16px] font-medium">
                Funded by
                <br />
                the European Union
              </span>
              <span className="text-[9px] leading-[14px] text-neutral-gray-40">
                NextGenerationEU
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-body text-[14px] leading-[20px] font-medium text-neutral-gray-40">
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
