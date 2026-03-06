import { Banner, Button, Divider, Link } from "@knodia/ui-kit/ui";
import { LockIcon } from "@phosphor-icons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import loginBg from "@/assets/login-bg.webp";
import { useAuth } from "@/contexts/auth";

const KNODIA_PROJECT_URL = "https://knodia.org";
const KNODE_NAME = "Orion Knode";

export const Route = createFileRoute("/login/")({
  component: LoginPage,
});

export function LoginPage() {
  const { error, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ replace: true, to: "/" });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-brand-dark">
      <img
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-80"
        src={loginBg}
      />
      <div className="elevation-5 relative z-10 mx-6 flex w-full max-w-140 flex-col items-center gap-6 rounded-2xl bg-primary-light px-10 py-16">
        <div className="flex flex-col gap-3 text-center text-primary-light-high-contrast">
          <p className="title-md">Welcome to</p>
          <h1 className="display-sm-em">{KNODE_NAME}</h1>
        </div>

        <p className="body-lg text-center text-primary-light-low-contrast">
          Sign in with your credentials to access the platform.
        </p>

        <div className="flex w-full flex-col items-center gap-3">
          {error && (
            <Banner kind="error">
              Unable to complete sign in. Please try again.
            </Banner>
          )}
          <Button
            className="w-full"
            hierarchy="brand"
            kind="filled"
            onClick={login}
            size="lg"
            type="button"
          >
            <LockIcon size={20} />
            {error ? "Retry" : "Sign in"}
          </Button>
          <p className="body-sm text-center text-primary-light-low-contrast">
            You will be redirected to the Authentication Service.
          </p>
        </div>

        <Banner className="items-start" kind="informative">
          <div className="flex flex-col gap-1">
            <p className="title-sm-em text-info-light-high-contrast">
              You don&apos;t have an account?
            </p>
            <p className="body-md text-secondary-light-mid-contrast">
              Visit the{" "}
              <Link
                href={KNODIA_PROJECT_URL}
                rel="noopener noreferrer"
                target="_blank"
                variant="primary"
              >
                Knodia project website
              </Link>{" "}
              to request an account. Once your account is activated, you can
              sign in from here.
            </p>
          </div>
        </Banner>

        <Divider kind="primary" type="light" />

        <p className="body-sm text-primary-light-low-contrast">
          Part of Knodia
        </p>
      </div>
    </div>
  );
}
