import { useState } from "react";
import LandingPage from "./rehab-snapshot-landing-page";
import AssessmentPage from "./rehab-snapshot-assessment-page";
import ReportPage from "./rehab-snapshot-report-page";

export default function RehabSnapshotPage() {
  const [screen, setScreen] = useState("landing"); // landing | assessment | report
  const [report, setReport] = useState(null);

  return (
    <div className="flex flex-col min-h-screen">
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