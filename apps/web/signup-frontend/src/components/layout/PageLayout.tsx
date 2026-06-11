import heroCanvas from "@/assets/hero-canvas.png";

import { Footer } from "./Footer";
import { Header } from "./Header";

export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="relative min-h-[800px] flex-1">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <img
            alt=""
            className="size-full max-w-none object-cover"
            src={heroCanvas}
          />
          <div className="absolute inset-0 bg-neutral-white/60" />
        </div>
        <div className="relative w-full max-w-(--header-shell-max) px-(--header-inline-padding) pt-[197px] pb-20">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
