import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./rehab-snapshot-report-page.css";
import { computeCMS, getSources } from "../engine/cmsEngine";
import { generateRehabSnapshotReport } from "../api/client";
import { useCareBridge } from "@/state/carebridge-context";

// Fixed title used to find/replace this item in the Plan list, so running
// the assessment again updates the same entry instead of duplicating it.
const REHAB_PLAN_TITLE = "Review Rehab Snapshot Results with Care Team";

function DifficultyBadge({ level }) {
  const map = {
    "normal":              { cls: "badge-green",  label: "Minimal difficulty" },
    "mild impairment":     { cls: "badge-amber",  label: "Mild difficulty" },
    "moderate impairment": { cls: "badge-orange", label: "Significant difficulty" },
    "severe impairment":   { cls: "badge-red",    label: "Severe difficulty" },
  };
  const { cls, label } = map[level] || map["normal"];
  return <span className={`badge ${cls}`}>{label}</span>;
}

// Each row now shows the raw measurement (value) AND a plain-language
// explanation (note) of what it actually means, so a caregiver doesn't
// have to guess what "Δ1°" or "Sway 2.4" is supposed to tell them.
function MetricRow({ icon, label, value, note }) {
  return (
    <div className="metric-row">
      <div className="metric-row-top">
        <span className="metric-icon">{icon}</span>
        <span className="metric-label">{label}</span>
        <span className="metric-value">{value}</span>
      </div>
      {note && <p className="metric-note">{note}</p>}
    </div>
  );
}

export default function RehabSnapshotReportPage({ report, onRestart }) {
  const [aiData,  setAiData]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const navigate = useNavigate();
  const { upsertRehabActionPlanItem } = useCareBridge();

  const { sit, arm, balance } = report;

  const cmsResult = useMemo(() => {
    if (!sit || !arm || !balance) return null;
    return computeCMS({ sit, arm, balance });
  }, [sit, arm, balance]);

  const priorityUpgrade =
    cmsResult?.severity === "moderate impairment" ||
    cmsResult?.severity === "severe impairment";

  const hasPartialTask =
    sit?.completed === false || arm?.completed === false || balance?.completed === false;

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        setError(null);
        const data = await generateRehabSnapshotReport({
          cms: cmsResult,
          raw: {
            sit: sit ? {
              reps: sit.reps,
              avgTimeSec: sit.avgTimeSec,
            } : null,
            arm: arm ? {
              peakLeft: arm.peakLeft,
              peakRight: arm.peakRight,
              asymmetryDeg: arm.asymmetryDeg,
            } : null,
            balance: balance ? {
              swayMagnitude: balance.swayMagnitude,
              durationSec: balance.durationSec,
            } : null,
          },
        });
        setAiData(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not generate report");
      } finally {
        setLoading(false);
      }
    }
    if (cmsResult) fetchReport();
  }, [cmsResult, report]);

  const sources = getSources();

  const handleUpdateToPlan = () => {
    if (!cmsResult) return;

    const priority = priorityUpgrade ? 1 : 2;
    const timeframe = priorityUpgrade ? "today" : "this_week";
    const checklist = [
      "Share the CareBridge Movement Signal score with the care team.",
      "Discuss the mobility concerns flagged during the Rehab Snapshot.",
      ...(aiData?.nextSteps?.length ? [aiData.nextSteps[0]] : []),
    ];

    upsertRehabActionPlanItem({
      priority,
      timeframe,
      title: REHAB_PLAN_TITLE,
      checklist,
    });

    navigate("/plan");
  };

  return (
    <div className="report-page">
      <main className="report-main">

        {/* TOP ROW — status tag + primary actions (single source of truth,
            the app-level header above already shows the CareBridge logo) */}
        <div className="report-top-row">
          <span className="module-tag">Assessment Complete</span>
          <div className="report-top-actions">
            <button className="btn btn-outline" onClick={onRestart}>
              ← Back
            </button>
            <button className="btn btn-primary" onClick={handleUpdateToPlan} disabled={!cmsResult}>
              Update to Plan
            </button>
          </div>
        </div>

        {/* PRIORITY BANNER */}
        <div className={`priority-banner ${priorityUpgrade ? "upgraded" : "stable"}`}>
          <div className="priority-left">
            <span className="priority-icon">{priorityUpgrade ? "⬆️" : "✅"}</span>
            <div>
              <p className="priority-title">
                {priorityUpgrade ? "CareBridge Priority Updated" : "Stable Mobility Status"}
              </p>
              <p className="priority-sub">
                {priorityUpgrade
                  ? "Mobility concerns detected — elevated care priority"
                  : "No major concerns detected at this time"}
              </p>
            </div>
          </div>
          <div className="priority-badge-wrap">
            <span className={`priority-badge ${priorityUpgrade ? "p1" : "p2"}`}>
              {priorityUpgrade ? "Priority #1" : "Priority #2"}
            </span>
          </div>
        </div>

        {/* CMS SCORE */}
        {cmsResult && (
          <section className="report-section">
            <h2>CareBridge Movement Signal</h2>
            <div className="cms-box">
              <h1>{cmsResult.CMS.toFixed(2)}</h1>
              <div className="cms-box-right">
                <span className="cms-label">Overall Score</span>
                <DifficultyBadge level={cmsResult.severity} />
              </div>
            </div>
          </section>
        )}

        {/* METRICS + AI SIDE BY SIDE */}
        <div className="report-grid">

          {/* Assessment Results */}
          <section className="report-section">
            <h2>Assessment Results</h2>

            {hasPartialTask && (
              <p className="metrics-partial-note">
                One or more tasks ended automatically after the 1-minute time limit before
                finishing — the figures below reflect partial progress, not a finished attempt.
              </p>
            )}

            <div className="metrics-list">
              <MetricRow
                icon="🪑"
                label="Sit-to-Stand"
                value={sit ? `${sit.reps}/3 reps · ${sit.avgTimeSec ?? "—"}s avg` : "—"}
                note={
                  sit &&
                  `Completed ${sit.reps} of 3 chair stands${
                    sit.avgTimeSec ? `, averaging ${sit.avgTimeSec} seconds per rep` : ""
                  }. Faster, more even pacing generally points to an easier sit-to-stand transfer.${
                    sit.completed === false ? " (Stopped early — 1-minute limit reached.)" : ""
                  }`
                }
              />
              <MetricRow
                icon="💪"
                label="Arm Raise"
                value={arm ? `L ${arm.peakLeft}° · R ${arm.peakRight}° · Δ${arm.asymmetryDeg}°` : "—"}
                note={
                  arm &&
                  `Left arm reached ${arm.peakLeft}° and right arm reached ${arm.peakRight}° (a full overhead reach is close to 180°). A ${arm.asymmetryDeg}° gap was seen between the two sides — larger gaps may point to one side being harder to lift.${
                    arm.completed === false ? " (Stopped early — 1-minute limit reached.)" : ""
                  }`
                }
              />
              <MetricRow
                icon="🧍"
                label="Standing Balance"
                value={balance ? `Sway ${(balance.swayMagnitude * 1000).toFixed(1)} · held ${balance.durationSec}s` : "—"}
                note={
                  balance &&
                  `While holding still for ${balance.durationSec}s, side-to-side body sway measured ${(balance.swayMagnitude * 1000).toFixed(1)} on the CareBridge scale — lower numbers mean steadier balance.${
                    balance.completed === false ? " (Stopped early — 1-minute limit reached.)" : ""
                  }`
                }
              />
            </div>
          </section>

          {/* AI Summary */}
          <section className="report-section">
            <h2>For Family &amp; Caregiver</h2>

            {loading && (
              <div className="ai-loading">
                <div className="spinner" />
                <span>Generating summary…</span>
              </div>
            )}

            {error && (
              <p className="ai-error">
                Could not generate summary. Check the main FastAPI backend at /api/v1/rehab-snapshot/report.<br />
                <code style={{ fontSize: 11, opacity: .7 }}>{error}</code>
              </p>
            )}

            {aiData && (
              <>
                <p className="ai-summary">{aiData.caregiverSummary}</p>

                <div className="flags-block">
                  <p className="flags-title">Clinical Flags — for care team</p>
                  <ul>
                    {aiData.clinicalFlags.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>

                <div className="flags-block next-steps" style={{ marginTop: 14 }}>
                  <p className="flags-title">Recommended Next Steps</p>
                  <ul>
                    {aiData.nextSteps.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </>
            )}
          </section>
        </div>

        {/* SOURCES */}
        <section className="report-section sources-section">
          <h2>Evidence &amp; Reference Sources</h2>
          <div className="sources-grid">
            {Object.entries(sources).map(([key, list]) => (
              <div key={key}>
                <p className="source-group-title">{key.toUpperCase()}</p>
                {list.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noreferrer"
                    className="source-link">
                    {s.title}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ACTIONS */}
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
          intended to support care coordination only. Always consult a licensed healthcare
          professional for medical decisions.
        </p>
      </main>
    </div>
  );
}