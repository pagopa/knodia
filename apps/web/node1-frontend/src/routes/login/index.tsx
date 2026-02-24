import { Button, Loader } from "@knodia/ui-kit/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth as useOidcAuth } from "react-oidc-context";

import { useAuth } from "@/contexts/auth";

export const Route = createFileRoute("/login/")({
  component: LoginPage,
});

function LoginPage() {
  const oidcAuth = useOidcAuth();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ replace: true, to: "/" });
    }
  }, [isAuthenticated, navigate]);

  if (oidcAuth.isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  return (
    <div className="flex flex-col gap-4 h-full items-center justify-center">
      {oidcAuth.error && <p>Login error: {oidcAuth.error.message}</p>}

      {!oidcAuth.isAuthenticated && (
        <Button onClick={() => void oidcAuth.signinRedirect()} type="button">
          {oidcAuth.error ? "Retry" : "Login"}
        </Button>
      )}
    </div>
  );
}
