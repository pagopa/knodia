import { Link } from "@tanstack/react-router";

import knodiaLogo from "@/assets/knodia-logo.svg";
import { Button } from "@/components/ui";
import { useAuthContext } from "@/contexts/auth";

export function Header() {
  const { isAuthenticated, logout } = useAuthContext();

  return (
    <header className="absolute inset-x-0 top-0 z-40 bg-neutral-white/40 backdrop-blur-[4px]">
      <div className="mx-auto flex h-(--header-height) w-full max-w-(--header-shell-max) items-center justify-between px-(--header-inline-padding) py-4">
        <Link to="/home">
          <img
            alt="Knodia"
            className="h-(--header-logo-height) w-(--header-logo-width)"
            src={knodiaLogo}
          />
        </Link>
        {isAuthenticated && (
          <Button onPress={logout} variant="text">
            Logout
          </Button>
        )}
      </div>
    </header>
  );
}
