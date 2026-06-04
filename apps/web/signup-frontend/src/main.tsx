import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { AuthProvider, useAuth } from "@/libs/auth";
import { router } from "@/libs/router";
import { queryClient } from "@/libs/tanstack-query";

// eslint-disable-next-line react-refresh/only-export-components
function InnerApp() {
  const auth = useAuth();

  return <RouterProvider context={{ auth }} router={router} />;
}

const rootElement = document.getElementById("root");

if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <InnerApp />
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}
