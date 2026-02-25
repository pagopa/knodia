import { RouterProvider } from "@tanstack/react-router";

import { useAuth } from "@/contexts/auth";
import { router } from "@/libs/router";

export function RouterWithAuth() {
  const { isAuthenticated } = useAuth();
  return (
    <RouterProvider context={{ auth: { isAuthenticated } }} router={router} />
  );
}
