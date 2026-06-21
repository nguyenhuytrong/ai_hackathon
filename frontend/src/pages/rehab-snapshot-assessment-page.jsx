import CameraView from "../tasks/CameraView";
import "./rehab-snapshot-assessment-page.css";

export default function RehabSnapshotAssessmentPage({ onComplete, onBack }) {
  return (
    // Bỏ subheader — bọc toàn bộ trong 1 card trắng
    <div className="rsassess-wrap">
      <div className="rsassess-card">

        {/* Camera column */}
        <div className="rsassess-camera">
          <CameraView onAllComplete={onComplete} />
        </div>

        {/* Sidebar column */}
        <aside className="rsassess-sidebar">

          {/* Back link ở top sidebar */}
          <button className="rsassess-back" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back
          </button>

          <div className="rsassess-info-card">
            <p className="rsassess-info-title">Instructions</p>
            <ol className="rsassess-list">
              <li>Position yourself so your <strong>full body</strong> is visible.</li>
              <li>Ensure <strong>good lighting</strong> from the front.</li>
              <li>Click <strong>Start Task</strong> before each exercise.</li>
              <li>A caregiver may stand nearby for support.</li>
            </ol>
          </div>

          <div className="rsassess-warning-card">
            <p>⚠️ <strong>Stop immediately</strong> if you feel pain, dizziness, or discomfort.</p>
          </div>

          <div className="rsassess-notice-card">
            <p>Results are <strong>not</strong> a medical diagnosis. For caregiver observation only.</p>
          </div>

        </aside>
      </div>
    </div>
  );
}