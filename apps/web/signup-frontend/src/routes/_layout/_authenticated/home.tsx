import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { match } from "ts-pattern";

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
  ResetPasswordsModal,
} from "@/components/features";
import { config } from "@/config/config";
import { useAuthContext } from "@/contexts/auth";
import { resolveOnboardingRedirect } from "@/services/onboarding";
import { getCurrentSignupUserQuery } from "@/services/queries";

export const Route = createFileRoute("/_layout/_authenticated/home")({
  beforeLoad: async ({ context: { queryClient } }) => {
    const user = await queryClient.ensureQueryData(getCurrentSignupUserQuery());
    const destination = resolveOnboardingRedirect(user.onboardingStatus);
    if (destination !== "/home") {
      throw redirect({ to: destination });
    }
    // Only ACTIVE reaches /home; narrow it for the component.
    return match(user)
      .with({ onboardingStatus: "ACTIVE" }, (activeUser) => ({
        user: activeUser,
      }))
      .otherwise(() => {
        throw redirect({ to: destination });
      });
  },
  component: RouteComponent,
});

type OpenModal =
  | "changeEmail"
  | "erasure"
  | "resetPasswords"
  | "restriction"
  | null;

function RouteComponent() {
  const { user } = Route.useRouteContext();
  const { sessionTokenClaims } = useAuthContext();
  const [openModal, setOpenModal] = useState<OpenModal>(null);

  const closeModal = (open: boolean) => {
    if (!open) setOpenModal(null);
  };

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
          <div className="flex flex-col gap-20">
            <CredentialsBanner
              email={user.email}
              onChangeEmail={() => setOpenModal("changeEmail")}
              onResetPasswords={() => setOpenModal("resetPasswords")}
            />
            <div className="flex flex-col gap-12">
              <h1 className="text-style-section-title text-neutral-graphite">
                Your journey into Knodia starts here
              </h1>
              <p className="w-[680px] max-w-full text-style-subheading text-neutral-graphite">
                Choose a Knode to enter the prototype and explore its
                interaction flows.
              </p>
              <div className="grid grid-cols-2 gap-12">
                {user.knodes.map((knode) => (
                  <KnodeCard
                    key={knode.knode}
                    knodeName={knode.knode}
                    organizationName={knode.organizationName}
                    prototypeHref={config.prototypeUrls[knode.knode]}
                    username={knode.username}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-neutral-white">
        <div className="mx-auto w-full max-w-(--header-shell-max) px-(--header-inline-padding) pt-[142.5px] pb-[222.5px]">
          <div className="grid min-h-[308px] w-[1134px] max-w-full grid-cols-[1fr_555px] items-center gap-[46px]">
            <DataWeCollectSection
              onDownload={() =>
                sessionTokenClaims &&
                downloadPersonalData({
                  ...sessionTokenClaims,
                  email: user.email,
                })
              }
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
      <ResetPasswordsModal
        email={user.email}
        isOpen={openModal === "resetPasswords"}
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
