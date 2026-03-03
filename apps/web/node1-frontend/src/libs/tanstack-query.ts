import { QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      throwOnError: false,
    },
    queries: {
      retry: (attemptIndex, error) => {
        if (attemptIndex >= 3) return false;
        // Retry on 404 for eventual consistency reasons (e.g. right after publish).
        if (isAxiosError(error) && error.response) {
          return error.response.status === 404;
        }
        return false;
      },
      retryDelay: 1_000,
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
