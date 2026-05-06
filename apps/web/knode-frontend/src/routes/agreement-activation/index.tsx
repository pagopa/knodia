import { createExternalSessionMutation } from "@knodia/bff-client/tanstack-query";
import { Banner, Button, Loader } from "@knodia/ui-kit/ui";
import loginBg from "@login-bg.webp";
import { LockIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { config } from "@/config/config";
import { useExternalAuth } from "@/contexts/external-auth/useExternalAuth";
import { externalClient } from "@/libs/external-axios";
import { endExternalSession } from "@/libs/external-session";

export const Route = createFileRoute("/agreement-activation/")({
  // Every landing visit starts from a clean slate, so no token bleeds into
  // the next attempt. beforeLoad runs outside React, so the React-side reset
  // happens in the component (see endSession below).
  beforeLoad: ({ context }) => {
    endExternalSession(context.queryClient);
  },
  component: AgreementActivationLandingPage,
});

export function AgreementActivationLandingPage() {
  const router = useRouter();
  const { acceptSession, endSession } = useExternalAuth();
  const magicLinkToken = useMemo(() => readMagicLinkTokenFromHash(), []);
  const [showMissingTokenError, setShowMissingTokenError] = useState(false);

  // Mirror beforeLoad's storage reset in React state, in case the parent
  // route stayed mounted with a token from a prior step in this tab.
  useEffect(() => {
    endSession();
  }, [endSession]);

  const { error, isPending, mutate, reset } = useMutation({
    ...createExternalSessionMutation({ client: externalClient }),
    onSuccess: (data) => {
      acceptSession(data.externalUiSessionToken);
      void router.navigate({
        replace: true,
        to: "/agreement-activation/recap",
      });
    },
  });

  const handleLogin = () => {
    if (!magicLinkToken) {
      setShowMissingTokenError(true);
      return;
    }
    setShowMissingTokenError(false);
    reset();
    mutate({ body: { magicLinkToken } });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-brand-dark">
      <img
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-80"
        decoding="async"
        fetchPriority="high"
        src={loginBg}
      />
      {isPending ? (
        <div className="relative z-10">
          <Loader label="Signing in..." />
        </div>
      ) : (
        <div className="elevation-5 relative z-10 mx-6 flex w-full max-w-140 flex-col items-center gap-6 rounded-2xl bg-primary-light px-10 py-16">
          <div className="flex flex-col gap-3 text-center text-primary-light-high-contrast">
            <p className="title-md">Welcome to</p>
            <h1 className="display-sm-em">{config.knodeId} Knode</h1>
            <p className="body-md text-primary-light-low-contrast">
              Log in to activate your Agreement.
            </p>
          </div>

          <Banner
            kind="informative"
            size="md"
            title="Demo mode: no eIDAS required"
          >
            In this demo you can proceed without an eIDAS account. In the full
            product, this step requires eIDAS authentication.
          </Banner>

          {showMissingTokenError && (
            <Banner kind="error" size="md" title="Invalid magic link">
              Return to your Knode and try again.
            </Banner>
          )}

          {error && (
            <Banner
              kind="error"
              size="md"
              title="Activation link expired or invalid"
            >
              Return to your Knode and request a new one.
            </Banner>
          )}

          <Button
            className="w-full"
            hierarchy="brand"
            kind="filled"
            onClick={handleLogin}
            size="lg"
            type="button"
          >
            <LockIcon size={20} />
            Log in
          </Button>

          <p className="body-sm text-center text-primary-light-low-contrast">
            Part of Knodia
          </p>
        </div>
      )}
    </div>
  );
}

function readMagicLinkTokenFromHash(): null | string {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  return params.get("token");
}
