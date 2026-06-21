import "./rehab-snapshot-page.css";
import { useState } from "react";
import LandingPage from "./rehab-snapshot-landing-page";
import AssessmentPage from "./rehab-snapshot-assessment-page";
import ReportPage from "./rehab-snapshot-report-page";

export default function RehabSnapshotPage() {
  const [screen, setScreen] = useState("landing");
  const [report, setReport] = useState(null);

  return (
    // Xoá min-h-screen — để AppLayout flex-1 tự quản lý height
    <div className="rsrehab-page flex flex-col">
      {screen === "landing" && (
        <LandingPage onStart={() => setScreen("assessment")} />
      )}
      {screen === "assessment" && (
        <AssessmentPage
          onComplete={(r) => { setReport(r); setScreen("report"); }}
          onBack={() => setScreen("landing")}
        />
      )}
      {screen === "report" && (
        <ReportPage
          report={report}
          onRestart={() => { setReport(null); setScreen("landing"); }}
        />
      )}
    </div>
  );
}