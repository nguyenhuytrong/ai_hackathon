import { useRef, useState, useCallback } from "react";
import usePose from "../hooks/usePose";
import SitToStand from "./SitToStand";
import ArmRaise from "./ArmRaise";
import StandingBalance from "./StandingBalance";
import "./CameraView.css";

const TASKS = [
  { id: "sit",     label: "Sit-to-Stand",    icon: "🪑", desc: "Sit, then stand — 3 times" },
  { id: "arm",     label: "Arm Raise",        icon: "💪", desc: "Lift both arms, hold 5 s" },
  { id: "balance", label: "Standing Balance", icon: "🧍", desc: "Stand still for 10 s" },
];

export default function CameraView({ onAllComplete }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  const [landmarks,   setLandmarks]   = useState(null);
  const [taskIndex,   setTaskIndex]   = useState(0);
  const [taskRunning, setTaskRunning] = useState(false);
  const [results,     setResults]     = useState({});
  const [countdown,   setCountdown]   = useState(null); // null | number
  const [poseReady,   setPoseReady]   = useState(false);

  const onPoseResults = useCallback((lm) => {
    if (!poseReady && lm) setPoseReady(true);
    setLandmarks(lm);
  }, [poseReady]);

  usePose({ videoRef, canvasRef, onResults: onPoseResults, enabled: true });

  const startCountdown = () => {
    let n = 3;
    setCountdown(n);
    const t = setInterval(() => {
      n -= 1;
      if (n <= 0) { clearInterval(t); setCountdown(null); setTaskRunning(true); }
      else setCountdown(n);
    }, 1000);
  };

  const handleTaskComplete = (taskId, data) => {
    const updated = { ...results, [taskId]: data };
    setResults(updated);
    setTaskRunning(false);

    if (taskIndex < TASKS.length - 1) {
      setTaskIndex(taskIndex + 1);
    } else {
      onAllComplete(updated);
    }
  };

  const currentTask = TASKS[taskIndex];

  return (
    <div className="camera-wrap">
      {/* Video feed */}
      <video ref={videoRef} className="camera-feed" playsInline muted />
      {/* Skeleton overlay */}
      <canvas ref={canvasRef} className="camera-canvas" width={640} height={480} />

      {/* Pose loading */}
      {!poseReady && (
        <div className="camera-loader">
          <div className="spinner" />
          <p>Loading pose engine…</p>
        </div>
      )}

      {/* Countdown overlay */}
      {countdown !== null && (
        <div className="countdown-overlay">
          <span className="countdown-num">{countdown}</span>
        </div>
      )}

      {/* Task logic overlay */}
      {taskRunning && poseReady && (
        <>
          {currentTask.id === "sit" && (
            <SitToStand
              landmarks={landmarks}
              running={taskRunning}
              onComplete={(d) => handleTaskComplete("sit", d)}
            />
          )}
          {currentTask.id === "arm" && (
            <ArmRaise
              landmarks={landmarks}
              running={taskRunning}
              onComplete={(d) => handleTaskComplete("arm", d)}
            />
          )}
          {currentTask.id === "balance" && (
            <StandingBalance
              landmarks={landmarks}
              running={taskRunning}
              onComplete={(d) => handleTaskComplete("balance", d)}
            />
          )}
        </>
      )}

      {/* Task info bar (bottom) */}
      <div className="camera-taskbar">
        {/* Progress dots */}
        <div className="task-progress">
          {TASKS.map((t, i) => (
            <div key={t.id}
              className={`task-step ${i < taskIndex ? "done" : i === taskIndex ? "active" : ""}`}>
              <span>{t.icon}</span>
              <span className="step-label">{t.label}</span>
            </div>
          ))}
        </div>

        {/* Current task CTA */}
        {!taskRunning && countdown === null && poseReady && (
          <div className="task-cta">
            <div>
              <p className="cta-title">{currentTask.icon} {currentTask.label}</p>
              <p className="cta-desc">{currentTask.desc}</p>
            </div>
            <button className="btn btn-primary" onClick={startCountdown}>
              Start Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}