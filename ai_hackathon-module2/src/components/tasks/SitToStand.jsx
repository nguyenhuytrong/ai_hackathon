import { useRef, useState, useEffect, useCallback } from "react";
import { calcAngle, isVisible } from "../../utils/poseUtils";

const TARGET_REPS = 3;

/**
 * SitToStand — measures hip angle to detect sit/stand transitions.
 * Reports: { reps, avgTimeSec, completedAt, difficulty }
 */
export default function SitToStand({ landmarks, onComplete, running }) {
  const stateRef   = useRef("unknown"); // "sit" | "stand" | "unknown"
  const repsRef    = useRef(0);
  const timesRef   = useRef([]);        // timestamps of each stand event
  const lastRepRef = useRef(null);

  const [reps,    setReps]    = useState(0);
  const [status,  setStatus]  = useState("Get into a seated position to begin.");
  const [phase,   setPhase]   = useState("idle"); // idle | active | done

  // Derive hip angle from MediaPipe landmarks
  const getHipAngle = useCallback((lm) => {
    const ids = window.PoseLandmark ?? {};
    // Fallback to numeric indices if PoseLandmark enum not loaded
    const shoulderL  = lm[11]; // LEFT_SHOULDER
    const hipL       = lm[23]; // LEFT_HIP
    const kneeL      = lm[25]; // LEFT_KNEE
    const shoulderR  = lm[12];
    const hipR       = lm[24];
    const kneeR      = lm[26];

    const leftOk  = isVisible(shoulderL) && isVisible(hipL) && isVisible(kneeL);
    const rightOk = isVisible(shoulderR) && isVisible(hipR) && isVisible(kneeR);

    if (!leftOk && !rightOk) return null;

    const angles = [];
    if (leftOk)  angles.push(calcAngle(shoulderL, hipL, kneeL));
    if (rightOk) angles.push(calcAngle(shoulderR, hipR, kneeR));
    return angles.reduce((a, b) => a + b, 0) / angles.length;
  }, []);

  useEffect(() => {
    if (!running || !landmarks || phase === "done") return;

    const hipAngle = getHipAngle(landmarks);
    if (hipAngle === null) return;

    const prevState = stateRef.current;

    // Thresholds: sitting ≈ hip angle < 130°; standing > 155°
    if (hipAngle < 130) {
      if (phase === "idle") {
        setPhase("active");
        setStatus("Good — now stand up!");
      } else if (stateRef.current === "stand") {
        setStatus("Good — sit back down, then stand again.");
      }
      stateRef.current = "sit";
    } else if (hipAngle > 155) {
      if (stateRef.current === "sit") {
        // Transition sit → stand = 1 rep
        const now = Date.now();
        if (lastRepRef.current) {
          timesRef.current.push((now - lastRepRef.current) / 1000);
        }
        lastRepRef.current = now;
        repsRef.current += 1;
        setReps(repsRef.current);

        if (repsRef.current >= TARGET_REPS) {
          setPhase("done");
          setStatus("All done! Great effort.");
          const avgTime = timesRef.current.length > 0
            ? timesRef.current.reduce((a, b) => a + b, 0) / timesRef.current.length
            : null;
          onComplete({
            reps:        repsRef.current,
            avgTimeSec:  avgTime ? +avgTime.toFixed(1) : null,
            difficulty:  avgTime > 4 ? "high" : avgTime > 2.5 ? "moderate" : "low",
          });
        } else {
          setStatus(`Rep ${repsRef.current}/${TARGET_REPS} — sit back down.`);
        }
      }
      stateRef.current = "stand";
    }
  }, [landmarks, running, phase]);

  return (
    <div className="task-overlay">
      <div className="task-rep-counter">
        <span className="rep-num">{reps}</span>
        <span className="rep-label">/ {TARGET_REPS} reps</span>
      </div>
      <p className="task-cue">{status}</p>
      <div className="rep-dots">
        {Array.from({ length: TARGET_REPS }).map((_, i) => (
          <span key={i} className={`rep-dot ${i < reps ? "filled" : ""}`} />
        ))}
      </div>
    </div>
  );
}