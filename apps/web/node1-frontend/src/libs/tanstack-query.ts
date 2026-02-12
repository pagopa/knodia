import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      throwOnError: false,
    },
    queries: {
      /**
       * This was primarily added to avoid a double request when navigating to a route that preloads data.
       * (Example: `/pages/production/eservices` which preloads the list of e-services).
       * A small staleTime avoids the extra request.
       *
       * Plus: this app is not a real-time app, so data doesn't need to be super fresh.
       */
      staleTime: 5_000,
      throwOnError: true,
    },
  },
});
