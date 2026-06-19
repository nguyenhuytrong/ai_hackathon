import { useState } from "react";
import LandingPage from "./pages/LandingPage";
import AssessmentPage from "./pages/AssessmentPage";
import ReportPage from "./pages/ReportPage";
import "./app.css";

export default function App() {
  const [screen, setScreen] = useState("landing"); // landing | assessment | report
  const [report, setReport] = useState(null);

  return (
    <div className="app">
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