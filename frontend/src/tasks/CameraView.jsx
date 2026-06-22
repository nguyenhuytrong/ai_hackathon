import { useRef, useState, useCallback, useEffect } from "react";
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

// Each task has a hard 1-minute window. If it isn't finished in time, the
// task ends automatically with whatever progress was made so far.
const TASK_DURATION_SECONDS = 60;

export default function CameraView({ onAllComplete }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const taskRef   = useRef(null); // imperative handle of the currently-rendered task

  const [landmarks,   setLandmarks]   = useState(null);
  const [taskIndex,   setTaskIndex]   = useState(0);
  const [taskRunning, setTaskRunning] = useState(false);
  const [results,     setResults]     = useState({});
  const [countdown,   setCountdown]   = useState(null); // null | number (3-2-1 start countdown)
  const [poseReady,   setPoseReady]   = useState(false);
  const [timeLeft,    setTimeLeft]    = useState(null); // seconds left in the 1-minute window
  const [timedOut,    setTimedOut]    = useState(false); // ran out of time before finishing
  const [attemptKey,  setAttemptKey]  = useState(0); // bump to force-remount a task on Retake

  const onPoseResults = useCallback((lm) => {
    if (!poseReady && lm) setPoseReady(true);
    setLandmarks(lm);
  }, [poseReady]);

  usePose({ videoRef, canvasRef, onResults: onPoseResults, enabled: true });

  const currentTask = TASKS[taskIndex];

  const startCountdown = () => {
    setTimedOut(false);
    let n = 3;
    setCountdown(n);
    const t = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(t);
        setCountdown(null);
        setTaskRunning(true);
        setTimeLeft(TASK_DURATION_SECONDS);
      } else {
        setCountdown(n);
      }
    }, 1000);
  };

  // Task finished on its own (rep target / hold time reached).
  const handleTaskComplete = (taskId, data) => {
    const updated = { ...results, [taskId]: { ...data, completed: true } };
    setResults(updated);
    setTaskRunning(false);
    setTimeLeft(null);
    setTimedOut(false);

    if (taskIndex < TASKS.length - 1) {
      setTaskIndex(taskIndex + 1);
    } else {
      onAllComplete(updated);
    }
  };

  // 1-minute window ran out before the task finished — keep whatever
  // progress was made and let the person choose Retake or move on.
  const handleTaskTimeout = useCallback(() => {
    const snapshot = taskRef.current?.getSnapshot?.() ?? {};
    setResults((prev) => ({
      ...prev,
      [currentTask.id]: { ...snapshot, completed: false },
    }));
    setTaskRunning(false);
    setTimeLeft(null);
    setTimedOut(true);
  }, [currentTask.id]);

  // Tick the 1-minute window down while a task is running.
  useEffect(() => {
    if (!taskRunning || timedOut || timeLeft === null) return;

    if (timeLeft <= 0) {
      handleTaskTimeout();
      return;
    }

    const tick = setTimeout(() => {
      setTimeLeft((s) => (s !== null ? s - 1 : s));
    }, 1000);

    return () => clearTimeout(tick);
  }, [taskRunning, timeLeft, timedOut, handleTaskTimeout]);

  const handleRetake = () => {
    setTimedOut(false);
    setAttemptKey((k) => k + 1);
    startCountdown();
  };

  const handleNextAfterTimeout = () => {
    setTimedOut(false);
    setAttemptKey((k) => k + 1);

    if (taskIndex < TASKS.length - 1) {
      setTaskIndex(taskIndex + 1);
    } else {
      setResults((prev) => {
        onAllComplete(prev);
        return prev;
      });
    }
  };

  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const seconds = timeLeft !== null ? timeLeft % 60 : 0;

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

      {/* Countdown overlay (3-2-1 before a task starts) */}
      {countdown !== null && (
        <div className="countdown-overlay">
          <span className="countdown-num">{countdown}</span>
        </div>
      )}

      {/* 1-minute task timer */}
      {taskRunning && !timedOut && timeLeft !== null && (
        <div
          aria-label={`Time remaining: ${minutes} minute ${seconds} seconds`}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: timeLeft <= 10 ? "rgba(217,79,79,0.92)" : "rgba(15,28,29,0.78)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            padding: "6px 12px",
            borderRadius: 999,
            zIndex: 5,
            letterSpacing: 0.3,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ⏱ {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      )}

      {/* Task logic overlay */}
      {taskRunning && poseReady && !timedOut && (
        <>
          {currentTask.id === "sit" && (
            <SitToStand
              key={`sit-${attemptKey}`}
              ref={taskRef}
              landmarks={landmarks}
              running={taskRunning}
              onComplete={(d) => handleTaskComplete("sit", d)}
            />
          )}
          {currentTask.id === "arm" && (
            <ArmRaise
              key={`arm-${attemptKey}`}
              ref={taskRef}
              landmarks={landmarks}
              running={taskRunning}
              onComplete={(d) => handleTaskComplete("arm", d)}
            />
          )}
          {currentTask.id === "balance" && (
            <StandingBalance
              key={`balance-${attemptKey}`}
              ref={taskRef}
              landmarks={landmarks}
              running={taskRunning}
              onComplete={(d) => handleTaskComplete("balance", d)}
            />
          )}
        </>
      )}

      {/* Timed out — let the person retake this task or move on */}
      {timedOut && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(15,28,29,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 6,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "24px 28px",
              maxWidth: 320,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 8px 24px rgba(0,0,0,.25)",
            }}
          >
            <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 6px" }}>
              Time's up
            </p>
            <p style={{ fontSize: 13, color: "#5A7172", margin: "0 0 18px", lineHeight: 1.5 }}>
              The 1-minute window for {currentTask.label} ended before the task was finished.
              Your progress so far has been saved.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="btn btn-outline" onClick={handleRetake}>
                Retake
              </button>
              <button className="btn btn-primary" onClick={handleNextAfterTimeout}>
                {taskIndex < TASKS.length - 1 ? "Next Task" : "Finish"}
              </button>
            </div>
          </div>
        </div>
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
        {!taskRunning && !timedOut && countdown === null && poseReady && (
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