import { Link } from "@tanstack/react-router";

import knodiaLogo from "@/assets/knodia-logo.svg";
import { Button } from "@/components/ui";
import { useAuthContext } from "@/contexts/auth";

export function Header() {
  const { isAuthenticated } = useAuthContext();

  return (
    <header className="absolute inset-x-0 top-0 z-40 flex h-(--header-height) items-center justify-between bg-neutral-white/40 px-(--header-inline-padding) py-4 backdrop-blur-[4px]">
      <Link to="/home">
        <img
          alt="Knodia"
          className="h-(--header-logo-height) w-(--header-logo-width)"
          src={knodiaLogo}
        />
      </Link>
      {/* TODO: implement logout */}
      {isAuthenticated && <Button variant="text">Logout</Button>}
    </header>
  );
}
