import { ClipboardList, Home, ListChecks, UserRound, WalletCards } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/intake", label: "Intake", icon: ClipboardList },
  { to: "/benefits", label: "Benefits", icon: WalletCards },
  { to: "/plan", label: "Plan", icon: ListChecks },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export function PrimaryNav() {
  return (
    <nav aria-label="Primary navigation" className="flex flex-wrap gap-2">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            cn(
              "inline-flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-primary/25",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:bg-muted",
            )
          }
        >
          <Icon aria-hidden="true" className="size-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
