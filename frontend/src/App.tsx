import { Activity, Database, FileText, HeartHandshake, Server } from "lucide-react";
import { AppRoutes } from "./routes";
import { ResponsibleAiBanner } from "./components/responsible-ai-banner";

const setupItems = [
  { label: "React/Vite frontend", icon: Activity },
  { label: "FastAPI backend", icon: Server },
  { label: "PostgreSQL + pgvector", icon: Database },
  { label: "Project documentation", icon: FileText },
];

export default function App() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground shadow-soft">
              <HeartHandshake aria-hidden="true" className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Phase 0 setup
              </p>
              <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
                CareBridge
              </h1>
            </div>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            A caregiver benefits and support navigator for caregivers after stroke discharge.
          </p>
        </header>

        <div className="grid flex-1 gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="space-y-8">
            <div className="space-y-5">
              <p className="font-serif text-5xl font-semibold leading-tight tracking-normal text-foreground sm:text-6xl">
                Setup for possible support matches, source evidence, and practical next steps.
              </p>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                This initial shell keeps the product centered on benefits navigation while the
                backend, database, and documentation foundation come online.
              </p>
            </div>
            <ResponsibleAiBanner />
          </section>

          <aside className="rounded-lg border border-border bg-white p-5 shadow-soft">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-normal">Repository Foundation</h2>
                <p className="text-sm text-muted-foreground">Runnable local services for Phase 0.</p>
              </div>
              <span className="rounded-md bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
                Local
              </span>
            </div>
            <div className="grid gap-3">
              {setupItems.map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-4 py-3"
                >
                  <Icon aria-hidden="true" className="size-5 text-primary" />
                  <span className="font-medium">{label}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <AppRoutes />
      </section>
    </main>
  );
}
