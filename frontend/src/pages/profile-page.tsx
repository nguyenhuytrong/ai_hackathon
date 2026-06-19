import { ActionLink } from "@/components/action-link";
import { EmptyState } from "@/components/route-states";
import { useCareBridge } from "@/state/carebridge-context";

const labels: Record<string, string> = {
  caregiverName: "Caregiver",
  careRecipient: "Care recipient",
  dischargeTime: "Discharge timing",
  mobility: "Mobility",
  transportation: "Transportation",
  insurance: "Insurance",
  caregiverWorking: "Caregiver working",
  caregiverBurden: "Caregiver burden",
  state: "State",
  county: "County",
  biggestChallenge: "Biggest challenge",
};

export function ProfilePage() {
  const { profile, loadDemoProfile, clearProfile } = useCareBridge();

  if (!profile) {
    return (
      <EmptyState title="No profile loaded">
        <p>Load the demo persona or complete the intake to preview caregiver context.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadDemoProfile}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/25"
          >
            Load Demo Persona
          </button>
          <ActionLink to="/intake" variant="secondary">Start Intake</ActionLink>
        </div>
      </EmptyState>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Caregiver context
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">Profile</h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            This is local demo information for the Phase 1 skeleton. It is not persisted to a
            backend until Phase 2.
          </p>
        </div>
        <button
          type="button"
          onClick={clearProfile}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:border-primary/40 hover:bg-muted focus:outline-none focus:ring-4 focus:ring-primary/25"
        >
          Clear Profile
        </button>
      </div>

      <dl className="mt-6 grid gap-3 md:grid-cols-2">
        {Object.entries(profile).map(([key, value]) => (
          <div key={key} className="rounded-md border border-border bg-muted/40 p-4">
            <dt className="text-sm text-muted-foreground">{labels[key] ?? key}</dt>
            <dd className="mt-1 font-semibold">{String(value).replaceAll("_", " ")}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
