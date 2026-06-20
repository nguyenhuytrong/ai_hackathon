import "./rehab-snapshot-landing-page.css";
// import "../index.css";

const TASKS = [
  { icon: "🪑", label: "Sit-to-Stand",     desc: "Rise from chair 3×" },
  { icon: "💪", label: "Arm Raise",         desc: "Lift both arms overhead" },
  { icon: "🧍", label: "Standing Balance",  desc: "Hold still for 10 s" },
];

export default function RehabSnapshotLandingPage({ onStart }) {
  return (
    <div className="landing grid gap-6 lg:grid-cols">
      <main className="landing-main rounded-lg border border-border bg-white p-6 shadow-soft">
        <div className="hero">
          <p className="eyebrow text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Mobility Assessment
          </p>
          <div className="mt-4 max-w-3xl space-y-4">
            <h1 className="hero-title font-serif text-4xl font-semibold leading-tight tracking-normal text-foreground sm:text-5xl">Assess Mobility<br />in Under 3 Minutes</h1>
            <p className="hero-sub text-lg leading-8 text-muted-foreground">
              Three simple camera-based tasks. No wearables, no clinic visit.
              Results update CareBridge priorities instantly.
            </p>
          </div>
          
          <button className="btn btn-primary btn-lg inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-primary/25 bg-primary text-primary-foreground hover:bg-primary/90" onClick={onStart}>
            <span>Start Assessment</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <p className="disclaimer">
            Not a medical diagnosis. For caregiver and care team use only.
          </p>
        </div>

        <div className="task-preview">
          {TASKS.map((t, i) => (
            <div key={i} className="task-chip flex items-center justify-between gap-4 rounded-md bg-muted/50 px-3 py-2">
              <span className="task-chip-icon">{t.icon}</span>
              <div>
                <p className="task-chip-label">{t.label}</p>
                <p className="task-chip-desc">{t.desc}</p>
              </div>
              <span className="task-chip-num">{i + 1}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}