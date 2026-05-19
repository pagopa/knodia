import { Navbar as UINavbar } from "@knodia/ui-kit/layout";
import { Button } from "@knodia/ui-kit/ui";
import { SignOutIcon } from "@phosphor-icons/react";
import { useRouter } from "@tanstack/react-router";

import { config } from "@/config/config";
import { useExternalAuth } from "@/contexts/external-auth/useExternalAuth";

export function ExternalLayout({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const { endSession, token } = useExternalAuth();

  const handleLogout = () => {
    endSession();
    void router.navigate({ replace: true, to: "/agreement-activation" });
  };

  // Only offer Log out when there is actually a session to clear.
  const onLogout = token !== null ? handleLogout : undefined;

  return (
    <>
      <UINavbar className="bg-brand-light">
        <span className="text-brand-light-high-contrast headline-sm truncate">
          {config.knodeId} Knode
        </span>
        {onLogout && (
          <Button
            hierarchy="neutral"
            kind="ghost"
            onClick={onLogout}
            type="button"
          >
            <SignOutIcon size={20} />
            Log out
          </Button>
        )}
      </UINavbar>
      <main className="p-10" id="main-content">
        {children}
      </main>
    </>
  );
}
