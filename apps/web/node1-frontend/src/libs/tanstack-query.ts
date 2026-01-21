import { QueryClient, type QueryClientConfig } from "@tanstack/react-query";

const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    mutations: {
      throwOnError: false,
    },
    queries: {
      retry: 3,
      throwOnError: true,
    },
  },
};

export const queryClient = new QueryClient(queryClientConfig);
