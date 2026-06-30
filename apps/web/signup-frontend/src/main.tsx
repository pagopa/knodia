import "@/styles/global.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { useCurrentUserSource } from "@/hooks/useCurrentUserSource";
import { router } from "@/libs/router";
import { queryClient } from "@/libs/tanstack-query";

import { AuthContextProvider, useAuthContext } from "./contexts/auth";

// eslint-disable-next-line react-refresh/only-export-components
function InnerApp() {
  const auth = useAuthContext();
  const currentUser = useCurrentUserSource();

  return <RouterProvider context={{ auth, currentUser }} router={router} />;
}

const rootElement = document.getElementById("root");

if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthContextProvider>
          <InnerApp />
        </AuthContextProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}
