import "@theme.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { OidcAuthProvider } from "@/contexts/auth";
import { RouterWithAuth } from "@/contexts/RouterWithAuth";
import { queryClient } from "@/libs/tanstack-query";

const rootElement = document.getElementById("root");

if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <OidcAuthProvider>
          <RouterWithAuth />
        </OidcAuthProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}
