import { HeartHandshake } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PrimaryNav } from "./primary-nav";
import { ResponsibleAiBanner } from "./responsible-ai-banner";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-lg border border-border bg-white/90 px-4 py-4 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link to="/" className="flex items-center gap-3 rounded-md focus:outline-none focus:ring-4 focus:ring-primary/25">
              <span className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
                <HeartHandshake aria-hidden="true" className="size-6" />
              </span>
              <span>
                <span className="block text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  CareBridge
                </span>
                <span className="block text-lg font-semibold tracking-normal">
                  Benefits and support navigator
                </span>
              </span>
            </Link>
            <PrimaryNav />
          </div>
        </header>

        <div className="flex-1 py-6">{children}</div>
        <ResponsibleAiBanner />
      </div>
    </main>
  );
}
