import { createSessionOptions } from "@knodia/bff-client/tanstack-query";
import { Button } from "@knodia/ui-kit/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";

import { APP_BASE_PATH } from "@/config/basepath";
import { config } from "@/config/config";
import { useAuth } from "@/contexts/auth";
import { client } from "@/libs/axios";

const loginSearchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/login/")({
  component: LoginPage,
  validateSearch: loginSearchSchema,
});

function LoginPage() {
  const navigate = useNavigate();
  const { token: searchToken } = Route.useSearch();
  const { isAuthenticated, setToken } = useAuth();

  const { data, isError, isSuccess } = useQuery({
    ...createSessionOptions({
      client,
      headers: { Authorization: `Bearer ${searchToken}` },
    }),
    enabled: !!searchToken,
    retry: false,
    throwOnError: false,
  });

  useEffect(() => {
    if (isSuccess && data.token) {
      setToken(data.token);
      navigate({ replace: true, to: "/" });
    }
  }, [isSuccess, data, setToken, navigate]);

  const handleLogin = () => {
    const returnUrl = `${window.location.origin}${APP_BASE_PATH}${Route.fullPath}`;
    window.location.href = `${config.authUrl}?return_url=${encodeURIComponent(returnUrl)}`;
  };

  const showLoginButton = !isAuthenticated && (isError || !searchToken);

  return (
    <div className="flex flex-col h-full items-center justify-center">
      {isError && <p>Invalid token</p>}

      {showLoginButton && (
        <Button onClick={handleLogin} type="button">
          {isError ? "Retry Login" : "Login"}
        </Button>
      )}
    </div>
  );
}
