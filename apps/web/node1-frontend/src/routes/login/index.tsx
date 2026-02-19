import { Button } from "@knodia/ui-kit/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";

import { config } from "@/config/config";
import { setAuthToken } from "@/libs/auth";

const loginSearchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/login/")({
  component: LoginPage,
  validateSearch: loginSearchSchema,
});

function LoginPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();

  const { isError, isSuccess } = useQuery({
    enabled: !!token,
    queryFn: async () => {
      const response = await fetch(`${config.bffUrl}/auth/session`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Token non valido");
      return response.json();
    },
    queryKey: ["auth-session", token],
    retry: false,
    throwOnError: false,
  });

  useEffect(() => {
    if (isSuccess && token) {
      setAuthToken(token);
      // TODO: navigate to home or profile
      // navigate({ replace: true, to: "/" });
    }
  }, [isSuccess, token, navigate]);

  const handleLogin = () => {
    const returnUrl = `${window.location.origin}/login`;
    window.location.href = `${config.authUrl}?return_url=${encodeURIComponent(returnUrl)}`;
  };

  const showButton = isError || !token;

  return (
    <div className="flex flex-col h-full items-center justify-center">
      {token && (
        <pre className="whitespace-pre-wrap break-all max-w-full">
          <b>Session Token:</b>
          <br />
          {token}
        </pre>
      )}
      {isError && <p>Invalid token</p>}
      {showButton && (
        <Button onClick={handleLogin} type="button">
          {isError ? "Retry Login" : "Login with SSO"}
        </Button>
      )}
    </div>
  );
}
