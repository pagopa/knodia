import { type RequestHandler } from "msw";

// Tests register their own handlers via `server.use(...)`; there are no defaults.
export const handlers: RequestHandler[] = [];
