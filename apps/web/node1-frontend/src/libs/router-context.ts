import { type QueryClient } from "@tanstack/react-query";

export interface RouterContext {
  auth: {
    isAuthenticated: () => boolean;
  };
  queryClient: QueryClient;
}
