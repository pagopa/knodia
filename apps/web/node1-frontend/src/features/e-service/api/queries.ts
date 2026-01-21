import { queryOptions } from "@tanstack/react-query";

import { api } from "@/libs/axios";

export const eserviceQueries = {
  getEServices: () =>
    queryOptions({
      queryFn: async () =>
        api
          .get("https://jsonplaceholder.typicode.com/posts")
          .then((res) => res.data),
      queryKey: ["eservices"],
    }),
};
