import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Navigate,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";

import { Pa31Page } from "./demo/Pa31Page";
import { TwoFormAjvPage } from "./demo/TwoFormAjvPage";
import { TwoFormJsonFormsPage } from "./demo/TwoFormJsonFormsPage";
import { TwoFormZodPage } from "./demo/TwoFormZodPage";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-4">
          <Link
            className="text-sm font-medium px-3 py-1 rounded text-gray-600 hover:text-gray-900 [&.active]:bg-blue-100 [&.active]:text-blue-700"
            to="/pa31"
          >
            PA 3.1
          </Link>
          <Link
            className="text-sm font-medium px-3 py-1 rounded text-gray-600 hover:text-gray-900 [&.active]:bg-blue-100 [&.active]:text-blue-700"
            to="/two-form-zod"
          >
            Two-form (Zod)
          </Link>
          <Link
            className="text-sm font-medium px-3 py-1 rounded text-gray-600 hover:text-gray-900 [&.active]:bg-blue-100 [&.active]:text-blue-700"
            to="/two-form-ajv"
          >
            Two-form (AJV)
          </Link>
          <Link
            className="text-sm font-medium px-3 py-1 rounded text-gray-600 hover:text-gray-900 [&.active]:bg-blue-100 [&.active]:text-blue-700"
            to="/two-form-jsonforms"
          >
            Two-form (JSON Forms)
          </Link>
        </div>
      </nav>
      <Outlet />
    </>
  ),
});

const indexRoute = createRoute({
  component: () => <Navigate to="/two-form-zod" />,
  getParentRoute: () => rootRoute,
  path: "/",
});

const pa31Route = createRoute({
  component: Pa31Page,
  getParentRoute: () => rootRoute,
  path: "/pa31",
});

const twoFormZodRoute = createRoute({
  component: TwoFormZodPage,
  getParentRoute: () => rootRoute,
  path: "/two-form-zod",
});

const twoFormAjvRoute = createRoute({
  component: TwoFormAjvPage,
  getParentRoute: () => rootRoute,
  path: "/two-form-ajv",
});

const twoFormJsonFormsRoute = createRoute({
  component: TwoFormJsonFormsPage,
  getParentRoute: () => rootRoute,
  path: "/two-form-jsonforms",
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  pa31Route,
  twoFormZodRoute,
  twoFormAjvRoute,
  twoFormJsonFormsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return <RouterProvider router={router} />;
}
