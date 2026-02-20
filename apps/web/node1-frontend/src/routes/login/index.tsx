import { Button } from "@knodia/ui-kit/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";

import { config } from "@/config/config";
import { clearAuthToken, getAuthToken, setAuthToken } from "@/libs/auth";

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
  const existingToken = getAuthToken();

  const { isError, isSuccess } = useQuery({
    enabled: !!token,
    queryFn: async () => {
      const response = await fetch(`${config.bffUrl}/auth/ui-session`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Token non valido");
      return response.json();
    },
    queryKey: ["auth-ui-session", token],
    retry: false,
    throwOnError: false,
  });

  useEffect(() => {
    if (isSuccess && token) {
      setAuthToken(token);
      // TODO: navigate to home or profile
      // navigate({ replace: true, to: "/" });
    }
  }, [isSuccess, token]);

  const handleLogin = () => {
    const returnUrl = `${window.location.origin}/ui/login`;
    window.location.href = `${config.authUrl}?return_url=${encodeURIComponent(returnUrl)}`;
  };

  const handleLogout = () => {
    clearAuthToken();
    navigate({ replace: true, to: "/login" });
  };

  const isLoggedIn = (!!token && isSuccess) || !!existingToken;
  const displayToken = isSuccess ? token : existingToken;
  const showLoginButton = !isLoggedIn && (isError || !token);

  return (
    <div className="flex flex-col h-full items-center justify-center">
      {isError ? (
        <p>Invalid token</p>
      ) : (
        displayToken && (
          <pre className="whitespace-pre-wrap break-all max-w-full">
            <b>UI Session Token:</b>
            <br />
            {displayToken}
          </pre>
        )
      )}

      {showLoginButton && (
        <Button onClick={handleLogin} type="button">
          {isError ? "Retry Login" : "Login"}
        </Button>
      )}
      {isLoggedIn && <Button onClick={handleLogout}>Logout</Button>}
    </div>
  );
}
