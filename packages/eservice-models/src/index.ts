import { createClient } from "./generated/client/index.ts";

export const catalogClient = createClient({
    baseUrl: 'http://localhost:3000',
});

export * from "./generated/index.ts";
