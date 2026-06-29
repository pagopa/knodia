import "@/styles/global.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM, { type Root } from "react-dom/client";

import { router } from "@/libs/router";
import { queryClient } from "@/libs/tanstack-query";

import { AuthContextProvider, useAuthContext } from "./contexts/auth";
import { useCurrentUserSource } from "./hooks/useCurrentUserSource";

declare global {
  interface Window {
    __knodiaSignupRoot?: Root;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
function InnerApp() {
  const auth = useAuthContext();
  const currentUser = useCurrentUserSource();

  return <RouterProvider context={{ auth, currentUser }} router={router} />;
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = window.__knodiaSignupRoot ?? ReactDOM.createRoot(rootElement);

window.__knodiaSignupRoot = root;

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthContextProvider>
        <InnerApp />
      </AuthContextProvider>
    </QueryClientProvider>
  </StrictMode>,
);
