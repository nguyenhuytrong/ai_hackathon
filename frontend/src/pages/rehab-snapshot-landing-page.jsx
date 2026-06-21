import "./rehab-snapshot-landing-page.css";

const TASKS = [
  { icon: "🪑", label: "Sit-to-Stand",    desc: "Rise from chair 3×" },
  { icon: "💪", label: "Arm Raise",        desc: "Lift both arms overhead" },
  { icon: "🧍", label: "Standing Balance", desc: "Hold still for 10 s" },
];

export default function RehabSnapshotLandingPage({ onStart }) {
  return (
    <div className="rslanding-wrap">
      <div className="rslanding-card">

        {/* Left — Hero */}
        <div className="rslanding-hero">
          <p className="rslanding-eyebrow">Mobility Assessment</p>
          <h1 className="rslanding-title">
            Assess Mobility<br />in Under 3 Minutes
          </h1>
          <p className="rslanding-sub">
            Three simple camera-based tasks. No wearables, no clinic visit.
            Results update CareBridge priorities instantly.
          </p>
          <button className="rslanding-btn" onClick={onStart}>
            Start Assessment
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <p className="rslanding-disclaimer">
            Not a medical diagnosis. For caregiver and care team use only.
          </p>
        </div>

        {/* Right — Task list */}
        <div className="rslanding-tasks">
          {TASKS.map((t, i) => (
            <div key={i} className="rslanding-chip">
              <span className="rslanding-chip-icon">{t.icon}</span>
              <div className="rslanding-chip-text">
                <p className="rslanding-chip-label">{t.label}</p>
                <p className="rslanding-chip-desc">{t.desc}</p>
              </div>
              <span className="rslanding-chip-num">{i + 1}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}