import CameraView from "../tasks/CameraView";
import "./rehab-snapshot-assessment-page.css";

export default function RehabSnapshotAssessmentPage({ onComplete, onBack }) {
  return (
    <div className="assessment-page">
      <header className="assessment-header">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Back
        </button>
        <div className="assessment-title">
          <span className="module-tag">Rehab Snapshot</span>
          <span className="header-sep">·</span>
          <span>Mobility Assessment</span>
        </div>
        <div style={{ width: 64 }} />
      </header>

      <main className="assessment-main">
        <div className="camera-container">
          <CameraView onAllComplete={onComplete} />
        </div>
        <aside className="assessment-sidebar">
          <div className="card sidebar-card">
            <h3>Instructions</h3>
            <ol className="instruction-list">
              <li>Position yourself so your full body is visible in the frame.</li>
              <li>Ensure good lighting from the front.</li>
              <li>Click <strong>Start Task</strong> before each exercise.</li>
              <li>A caregiver or support person may stand nearby.</li>
            </ol>
          </div>
          <div className="card sidebar-card warning-card">
            <p>⚠️ Stop immediately if you feel pain, dizziness, or discomfort.</p>
          </div>
          <div className="card sidebar-card info-card">
            <p>
              Results are <strong>not</strong> a medical diagnosis.
              This tool supports caregiver observation only.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}