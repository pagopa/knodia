import { Button } from "@knodia/ui-kit/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";

import { config } from "@/config/config";
import { useAuth } from "@/contexts/auth";

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
  const { isAuthenticated, logout, setToken } = useAuth();

  const { data, isError, isSuccess } = useQuery({
    enabled: !!searchToken,
    queryFn: async () => {
      const response = await fetch(`${config.bffUrl}/auth/ui-session`, {
        headers: { Authorization: `Bearer ${searchToken}` },
      });
      if (!response.ok) throw new Error("Token non valido");
      return response.json();
    },
    queryKey: ["auth-ui-session", searchToken],
    retry: false,
    throwOnError: false,
  });

  useEffect(() => {
    if (isSuccess && data.uiSessionToken) {
      setToken(data.uiSessionToken);
      navigate({ replace: true, to: "/" });
    }
  }, [isSuccess, data, setToken, navigate]);

  const handleLogin = () => {
    const returnUrl = `${window.location.origin}/ui/login`;
    window.location.href = `${config.authUrl}?return_url=${encodeURIComponent(returnUrl)}`;
  };

  const handleLogout = () => {
    logout();
    navigate({ replace: true, to: "/login" });
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
      {isAuthenticated && <Button onClick={handleLogout}>Logout</Button>}
    </div>
  );
}
