import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import heroCanvas from "@/assets/hero-canvas.webp";
import {
  ChangeEmailModal,
  CredentialsBanner,
  DataWeCollectSection,
  downloadPersonalData,
  GdprRightsCard,
  KnodeCard,
  RequestErasureModal,
  RequestRestrictionModal,
} from "@/components/account";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const Route = createFileRoute("/_layout/_authenticated/home")({
  component: RouteComponent,
});

// TODO(KN-753): replace with real Knode assignments once the signup user API exposes them.
const KNODES = [
  {
    knodeName: "Orion",
    organizationName: "Rigel 123 Org",
    username: "rigel_123_user",
  },
  {
    knodeName: "Lynx",
    organizationName: "Ursa 123 Org",
    username: "ursa_123_user",
  },
];

type OpenModal = "changeEmail" | "erasure" | "restriction" | null;

function RouteComponent() {
  const user = useCurrentUser();
  const [openModal, setOpenModal] = useState<OpenModal>(null);

  const closeModal = (open: boolean) => !open && setOpenModal(null);

  return (
    <>
      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <img
            alt=""
            className="size-full max-w-none object-cover"
            src={heroCanvas}
          />
          <div className="absolute inset-0 bg-neutral-white/60" />
        </div>
        <div className="relative mx-auto w-full max-w-(--header-shell-max) px-(--header-inline-padding) pt-[216px] pb-20">
          <div className="flex flex-col gap-[70px]">
            <div className="flex flex-col gap-12">
              <h1 className="text-style-section-title text-neutral-graphite">
                Your journey into Knodia starts here
              </h1>
              <p className="w-[680px] max-w-full text-style-subheading text-neutral-graphite">
                Choose a Knode to enter the prototype and explore its
                interaction flows.
              </p>
              <div className="grid grid-cols-2 gap-12">
                {KNODES.map((knode) => (
                  <KnodeCard key={knode.knodeName} {...knode} />
                ))}
              </div>
            </div>
            <CredentialsBanner email={user?.email ?? "yourname@mail.com"} />
          </div>
        </div>
      </section>

      <section className="bg-neutral-white">
        <div className="mx-auto w-full max-w-(--header-shell-max) px-(--header-inline-padding) pt-[142.5px] pb-[222.5px]">
          <div className="grid min-h-[308px] w-[1134px] max-w-full grid-cols-[1fr_555px] items-center gap-[46px]">
            <DataWeCollectSection
              onChangeEmail={() => setOpenModal("changeEmail")}
              onDownload={() => user && downloadPersonalData(user)}
            />
            <GdprRightsCard
              onRequestErasure={() => setOpenModal("erasure")}
              onRequestRestriction={() => setOpenModal("restriction")}
            />
          </div>
        </div>
      </section>

      <ChangeEmailModal
        isOpen={openModal === "changeEmail"}
        onOpenChange={closeModal}
      />
      <RequestErasureModal
        isOpen={openModal === "erasure"}
        onOpenChange={closeModal}
      />
      <RequestRestrictionModal
        isOpen={openModal === "restriction"}
        onOpenChange={closeModal}
      />
    </>
  );
}
