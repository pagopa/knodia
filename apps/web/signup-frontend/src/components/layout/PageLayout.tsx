import { Footer } from "./Footer";
import { Header } from "./Header";

export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-neutral-white">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
