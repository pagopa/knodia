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
  });

  useEffect(() => {
    if (isSuccess && token) {
      setAuthToken(token);
      navigate({ replace: true, to: "/" });
    }
  }, [isSuccess, token, navigate]);

  const handleLogin = () => {
    const returnUrl = `${window.location.origin}/login`;
    window.location.href = `${config.authUrl}?return_url=${encodeURIComponent(returnUrl)}`;
  };

  return (
    <div className="flex h-full items-center justify-center">
      {isError ? (
        <p>Token non valido</p>
      ) : token ? null : (
        <Button onClick={handleLogin} type="button">
          Login
        </Button>
      )}
    </div>
  );
}
