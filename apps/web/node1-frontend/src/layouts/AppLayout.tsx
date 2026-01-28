import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="flex h-[calc(100vh-72px)]">
        <Sidebar />
        <main className="p-10 flex-1 overflow-auto">{children}</main>
      </div>
    </>
  );
}
