import "./rehab-snapshot-landing-page.css";

const TASKS = [
  { icon: "🪑", label: "Sit-to-Stand",     desc: "Rise from chair 3×" },
  { icon: "💪", label: "Arm Raise",         desc: "Lift both arms overhead" },
  { icon: "🧍", label: "Standing Balance",  desc: "Hold still for 10 s" },
];

export default function RehabSnapshotLandingPage({ onStart }) {
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="logo">
          <span className="logo-mark">CB</span>
          <span className="logo-text">CareBridge</span>
        </div>
        <span className="module-tag">Rehab Snapshot</span>
      </header>

      <main className="landing-main">
        <div className="hero">
          <p className="eyebrow">Module 2 · Mobility Assessment</p>
          <h1 className="hero-title">Assess Mobility<br />in Under 3 Minutes</h1>
          <p className="hero-sub">
            Three simple camera-based tasks. No wearables, no clinic visit.
            Results update CareBridge priorities instantly.
          </p>
          <button className="btn btn-primary btn-lg" onClick={onStart}>
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
            <div key={i} className="task-chip">
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

      <footer className="landing-footer">
        <p>Powered by MediaPipe · Claude AI · CareBridge Platform</p>
      </footer>
    </div>
  );
}