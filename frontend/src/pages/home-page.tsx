import { ArrowRight, ClipboardList, PlayCircle } from "lucide-react";
import { ActionLink } from "@/components/action-link";
import { CareSignalCard } from "@/components/care-signal-card";
import { StatusBadge } from "@/components/status-badge";
import { careSignals, mockRecommendations } from "@/data/mock-carebridge";
import { useCareBridge } from "@/state/carebridge-context";

export function HomePage() {
  const { loadDemoProfile, profile } = useCareBridge();

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-lg border border-border bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          Post-discharge support guidance
        </p>
        <div className="mt-4 max-w-3xl space-y-4">
          <h1 className="font-serif text-4xl font-semibold leading-tight tracking-normal text-foreground sm:text-5xl">
            Your Support Navigation Plan
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">
            CareBridge turns a post-stroke discharge situation into possible support areas,
            information to confirm, and practical next steps for the week ahead.
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          {mockRecommendations.map((recommendation) => (
            <article
              key={recommendation.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold tracking-normal">{recommendation.title}</h2>
                <p className="text-sm text-muted-foreground">{recommendation.nextSteps[0]}</p>
              </div>
              <StatusBadge status={recommendation.matchStatus} />
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <ActionLink to="/intake">
            <ClipboardList aria-hidden="true" className="mr-2 size-4" />
            Start Intake
          </ActionLink>
          <button
            type="button"
            onClick={loadDemoProfile}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:border-primary/40 hover:bg-muted focus:outline-none focus:ring-4 focus:ring-primary/25"
          >
            <PlayCircle aria-hidden="true" className="mr-2 size-4" />
            Load Demo Persona
          </button>
          <ActionLink to="/benefits" variant="secondary">
            View Benefits
            <ArrowRight aria-hidden="true" className="ml-2 size-4" />
          </ActionLink>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-lg border border-border bg-white p-5 shadow-soft">
          <h2 className="text-xl font-semibold tracking-normal">Current Situation</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <SituationRow label="Caregiver" value={profile?.caregiverName ?? "Demo profile not loaded"} />
            <SituationRow label="Care recipient" value={profile?.careRecipient ?? "Mother"} />
            <SituationRow label="Discharged" value="5 days ago" />
            <SituationRow label="Location" value={profile?.county ?? "Montgomery County, OH"} />
          </dl>
        </section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {careSignals.map((signal) => (
            <CareSignalCard key={signal.label} {...signal} />
          ))}
        </div>
      </aside>
    </div>
  );
}

function SituationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-muted/50 px-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-right">{value}</dd>
    </div>
  );
}
