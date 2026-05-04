import { RouterProvider } from "@tanstack/react-router";

import { useAuth } from "@/contexts/auth";
import { router } from "@/libs/router";

export function RouterWithAuth() {
  const { isAuthenticated, roles } = useAuth();
  return (
    <RouterProvider
      context={{ auth: { isAuthenticated, roles } }}
      router={router}
    />
  );
}
