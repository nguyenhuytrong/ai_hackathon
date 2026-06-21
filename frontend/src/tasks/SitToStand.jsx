import { useRef, useState, useEffect, useCallback } from "react";
import { calcAngle, isVisible } from "../utils/poseUtils";

const TARGET_REPS = 3;

export default function SitToStand({ landmarks, onComplete, running }) {
  const stateRef = useRef("unknown"); // sit | stand | unknown
  const repsRef = useRef(0);
  const timesRef = useRef([]);
  const lastRepRef = useRef(null);

  const [reps, setReps] = useState(0);
  const [status, setStatus] = useState("Get into a seated position to begin.");
  const [phase, setPhase] = useState("idle");

  // ---------------------------
  // HIP ANGLE
  // ---------------------------
  const getHipAngle = useCallback((lm) => {
    const shoulderL = lm[11];
    const hipL = lm[23];
    const kneeL = lm[25];

    const shoulderR = lm[12];
    const hipR = lm[24];
    const kneeR = lm[26];

    const leftOk =
      isVisible(shoulderL) && isVisible(hipL) && isVisible(kneeL);

    const rightOk =
      isVisible(shoulderR) && isVisible(hipR) && isVisible(kneeR);

    if (!leftOk && !rightOk) return null;

    const angles = [];

    if (leftOk) {
      angles.push(calcAngle(shoulderL, hipL, kneeL));
    }
    if (rightOk) {
      angles.push(calcAngle(shoulderR, hipR, kneeR));
    }

    return angles.reduce((a, b) => a + b, 0) / angles.length;
  }, []);

  // ---------------------------
  // MAIN LOOP
  // ---------------------------
  useEffect(() => {
    if (!running || !landmarks || phase === "done") return;

    const hipAngle = getHipAngle(landmarks);
    if (hipAngle === null) return;

    // STATE DETECTION
    if (hipAngle < 130) {
      if (phase === "idle") {
        setPhase("active");
        setStatus("Good — now stand up!");
      }
      stateRef.current = "sit";
    }

    if (hipAngle > 155) {
      if (stateRef.current === "sit") {
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

          const avgTime =
            timesRef.current.length > 0
              ? timesRef.current.reduce((a, b) => a + b, 0) /
                timesRef.current.length
              : null;

          // ❌ NO difficulty here (moved to CMS engine)

          onComplete({
            reps: repsRef.current,
            avgTimeSec: avgTime ? Number(avgTime.toFixed(1)) : null,
          });
        } else {
          setStatus(`Rep ${repsRef.current}/${TARGET_REPS} — sit back down.`);
        }
      }

      stateRef.current = "stand";
    }
  }, [landmarks, running, phase]);

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <div className="task-overlay">
      <div className="task-rep-counter">
        <span className="rep-num">{reps}</span>
        <span className="rep-label">/ {TARGET_REPS}</span>
      </div>

      <p className="task-cue">{status}</p>

      <div className="rep-dots">
        {Array.from({ length: TARGET_REPS }).map((_, i) => (
          <span
            key={i}
            className={`rep-dot ${i < reps ? "filled" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}