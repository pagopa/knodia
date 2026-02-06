import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="flex h-[calc(100vh-72px)]">
        <Sidebar />
        {/* !!! The id is used in TanstackRouter configuration to set the target for scroll restoration. */}
        {/* !!! @see https://tanstack.com/router/v1/docs/framework/react/guide/scroll-restoration#scroll-to-top--nested-scrollable-areas */}
        <main className="p-10 flex-1 overflow-auto" id="main-content">
          {children}
        </main>
      </div>
    </>
  );
}
