import { Button, Loader } from "@knodia/ui-kit/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuth } from "@/contexts/auth";

export const Route = createFileRoute("/login/")({
  component: LoginPage,
});

export function LoginPage() {
  const { error, isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();

  // Redirect after completing the OIDC + token exchange flow while on this page.
  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ replace: true, to: "/" });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex flex-col gap-4 h-full items-center justify-center">
      <LoginPageContent
        error={error}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        onClick={login}
      />
    </div>
  );
}

function LoginPageContent({
  error,
  isAuthenticated,
  isLoading,
  onClick,
}: {
  error?: Error | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onClick: () => void;
}) {
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (error) {
    return (
      <>
        <p>Login error: {error.message}</p>
        <Button onClick={onClick} type="button">
          Retry
        </Button>
      </>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <Button onClick={onClick} type="button">
      Login
    </Button>
  );
}
