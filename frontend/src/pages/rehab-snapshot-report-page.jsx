import { useState, useEffect } from "react";
import "./rehab-snapshot-report-page.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

function DifficultyBadge({ level }) {
  const map = {
    low:      { cls: "badge-green",  label: "Minimal difficulty" },
    moderate: { cls: "badge-amber",  label: "Moderate difficulty" },
    high:     { cls: "badge-red",    label: "Significant difficulty" },
  };
  const { cls, label } = map[level] || map.low;
  return <span className={`badge ${cls}`}>{label}</span>;
}

function MetricRow({ icon, label, value, badge }) {
  return (
    <div className="metric-row">
      <span className="metric-icon">{icon}</span>
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      {badge && <DifficultyBadge level={badge} />}
    </div>
  );
}

export default function RehabSnapshotReportPage({ report, onRestart }) {
  const [aiData,   setAiData]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const { sit, arm, balance } = report;

  // Derive overall priority change for CareBridge
  const severityCount = [sit, arm, balance].filter(t => t?.difficulty === "high").length;
  const priorityUpgrade = severityCount >= 2;

  useEffect(() => {
    async function fetchReport() {
      try {
        console.log("BACKEND =", BACKEND);
        const res = await fetch(`${BACKEND}/generate-report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sit, arm, balance }),
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setAiData(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, []);

  return (
    <div className="report-page">
      <header className="report-header">
        <div className="logo">
          <span className="logo-mark">CB</span>
          <span className="logo-text">CareBridge</span>
        </div>
        <span className="module-tag">Assessment Complete</span>
      </header>

      <main className="report-main">

        {/* ── Priority Update Banner ── */}
        <div className={`priority-banner ${priorityUpgrade ? "upgraded" : "stable"}`}>
          <div className="priority-left">
            {priorityUpgrade ? (
              <>
                <span className="priority-icon">⬆️</span>
                <div>
                  <p className="priority-title">CareBridge Priority Updated</p>
                  <p className="priority-sub">
                    Mobility concerns detected — care priority elevated to <strong>Priority #1</strong>.
                  </p>
                </div>
              </>
            ) : (
              <>
                <span className="priority-icon">✅</span>
                <div>
                  <p className="priority-title">Priority Unchanged</p>
                  <p className="priority-sub">No major mobility concerns detected at this time.</p>
                </div>
              </>
            )}
          </div>
          <div className="priority-badge-wrap">
            <span className={`priority-badge ${priorityUpgrade ? "p1" : "p2"}`}>
              {priorityUpgrade ? "Priority #1" : "Priority #2"}
            </span>
          </div>
        </div>

        <div className="report-grid">

          {/* ── Raw Metrics ── */}
          <section className="card report-section">
            <h2 className="section-title">Assessment Results</h2>
            <div className="metrics-list">
              <MetricRow
                icon="🪑"
                label="Sit-to-Stand"
                value={sit ? `${sit.reps}/3 reps${sit.avgTimeSec ? ` · ${sit.avgTimeSec}s avg` : ""}` : "—"}
                badge={sit?.difficulty}
              />
              <MetricRow
                icon="💪"
                label="Arm Raise"
                value={arm ? `L ${arm.peakLeft}° · R ${arm.peakRight}° · Δ${arm.asymmetryDeg}°` : "—"}
                badge={arm?.difficulty}
              />
              <MetricRow
                icon="🧍"
                label="Standing Balance"
                value={balance ? `Sway ${(balance.swayMagnitude * 1000).toFixed(1)} units` : "—"}
                badge={balance?.difficulty}
              />
            </div>
          </section>

          {/* ── AI Summary ── */}
          <section className="card report-section">
            <h2 className="section-title">
              For Family & Caregiver
            </h2>
            {loading && (
              <div className="ai-loading">
                <div className="spinner" />
                <p>Generating summary…</p>
              </div>
            )}
            {error && (
              <p className="ai-error">
                Could not generate AI summary. Please check backend connection.<br />
                <code>{error}</code>
              </p>
            )}
            {aiData && (
              <>
                <p className="ai-summary">{aiData.caregiver_summary}</p>
                <div className="clinical-flags">
                  <p className="flags-title">Clinical flags for care team</p>
                  <ul>
                    {aiData.clinical_flags.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="next-steps">
                  <p className="flags-title">Recommended next steps</p>
                  <ul>
                    {aiData.next_steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </section>
        </div>

        <div className="report-actions">
          <button className="btn btn-outline" onClick={() => window.print()}>
            🖨 Print Report
          </button>
          <button className="btn btn-primary" onClick={onRestart}>
            New Assessment
          </button>
        </div>

        <p className="report-disclaimer">
          This assessment is not a medical diagnosis. Results are observational signals
          intended to support care coordination. Always consult a licensed healthcare
          professional for medical decisions.
        </p>
      </main>
    </div>
  );
}