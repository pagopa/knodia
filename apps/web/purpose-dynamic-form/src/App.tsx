import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";

import { CompactFormPage } from "./demo/CompactFormPage";
import { DataSharingPage } from "./demo/DataSharingPage";
import { FlatFormPage } from "./demo/FlatFormPage";
import { Pa31Page } from "./demo/Pa31Page";
import { ThreeStepFormPage } from "./demo/ThreeStepFormPage";
import { TwoFormAjvPage } from "./demo/TwoFormAjvPage";
import { TwoFormJsonFormsPage } from "./demo/TwoFormJsonFormsPage";
import { TwoFormTanstackAjvPage } from "./demo/TwoFormTanstackAjvPage";
import { TwoFormUIKitPage } from "./demo/TwoFormUIKitPage";
import { TwoFormZodPage } from "./demo/TwoFormZodPage";

function NavSelect() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-2xl mx-auto">
        <select
          className="text-sm font-medium px-3 py-1.5 rounded border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onChange={(e) => navigate({ to: e.target.value })}
          value={pathname}
        >
          <optgroup label="PDND schema">
            <option value="/pa31">PA 3.1</option>
          </optgroup>
          <optgroup label="Standalone forms">
            <option value="/data-sharing">Data Sharing</option>
          </optgroup>
          <optgroup label="UI schema variants">
            <option value="/compact-form">Compact Form</option>
            <option value="/flat-form">Flat Form</option>
            <option value="/three-step-form">Three-Step Form</option>
          </optgroup>
          <optgroup label="Two-form approaches">
            <option value="/two-form-zod">Zod</option>
            <option value="/two-form-ajv">AJV</option>
            <option value="/two-form-jsonforms">JSON Forms</option>
            <option value="/two-form-tanstack">TanStack + AJV</option>
            <option value="/two-form-uikit">UI Kit</option>
          </optgroup>
        </select>
      </div>
    </nav>
  );
}

const rootRoute = createRootRoute({
  component: () => (
    <>
      <NavSelect />
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

const twoFormTanstackRoute = createRoute({
  component: TwoFormTanstackAjvPage,
  getParentRoute: () => rootRoute,
  path: "/two-form-tanstack",
});

const twoFormUIKitRoute = createRoute({
  component: TwoFormUIKitPage,
  getParentRoute: () => rootRoute,
  path: "/two-form-uikit",
});

const dataSharingRoute = createRoute({
  component: DataSharingPage,
  getParentRoute: () => rootRoute,
  path: "/data-sharing",
});

const compactFormRoute = createRoute({
  component: CompactFormPage,
  getParentRoute: () => rootRoute,
  path: "/compact-form",
});

const flatFormRoute = createRoute({
  component: FlatFormPage,
  getParentRoute: () => rootRoute,
  path: "/flat-form",
});

const threeStepFormRoute = createRoute({
  component: ThreeStepFormPage,
  getParentRoute: () => rootRoute,
  path: "/three-step-form",
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  pa31Route,
  dataSharingRoute,
  compactFormRoute,
  flatFormRoute,
  threeStepFormRoute,
  twoFormZodRoute,
  twoFormAjvRoute,
  twoFormJsonFormsRoute,
  twoFormTanstackRoute,
  twoFormUIKitRoute,
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
