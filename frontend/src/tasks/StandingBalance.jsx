import { useRef, useState, useEffect } from "react";
import { isVisible, midpoint, stdDev } from "../utils/poseUtils";

const HOLD_SECONDS = 10;

export default function StandingBalance({
  landmarks,
  onComplete,
  running,
}) {
  const hipXHistory = useRef([]);
  const hipYHistory = useRef([]);
  const frameCount = useRef(0);
  const doneRef = useRef(false);

  const [sway, setSway] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState(
    "Stand upright and hold still for 10 seconds."
  );

  // ---------------------------
  // MAIN LOOP
  // ---------------------------
  useEffect(() => {
    if (!running || !landmarks || doneRef.current) return;

    const lHip = landmarks[23];
    const rHip = landmarks[24];

    if (!isVisible(lHip) || !isVisible(rHip)) return;

    const mid = midpoint(lHip, rHip);

    hipXHistory.current.push(mid.x);
    hipYHistory.current.push(mid.y);
    frameCount.current += 1;

    const t = Math.min(frameCount.current / 30, HOLD_SECONDS);
    setElapsed(t);

    const swayX = stdDev(hipXHistory.current.slice(-90));
    const swayY = stdDev(hipYHistory.current.slice(-90));

    const swayMag = Math.sqrt(swayX ** 2 + swayY ** 2);
    setSway(swayMag);

    // ---------------------------
    // REAL-TIME FEEDBACK ONLY
    // ---------------------------
    if (t < HOLD_SECONDS) {
      if (swayMag > 0.032) {
        setStatus("Try to hold steadier — reach for support if needed.");
      } else if (swayMag > 0.018) {
        setStatus("Good — keep balancing…");
      } else {
        setStatus("Excellent steadiness!");
      }
    }

    // ---------------------------
    // COMPLETION
    // ---------------------------
    if (t >= HOLD_SECONDS && !doneRef.current) {
      doneRef.current = true;

      const finalSway = stdDev(hipXHistory.current);

      setStatus("Balance assessed ✓");

      // ❌ NO difficulty here (moved to CMS engine)

      onComplete({
        swayMagnitude: Number(finalSway.toFixed(4)),
        durationSec: HOLD_SECONDS,
      });
    }
  }, [landmarks, running]);

  const pct = elapsed / HOLD_SECONDS;

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <div className="task-overlay">
      <div className="balance-ring-wrap">
        <svg className="balance-ring" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="#D9EDED"
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke={
              sway > 0.032
                ? "var(--red)"
                : sway > 0.018
                ? "var(--amber)"
                : "var(--green)"
            }
            strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct)}`}
            strokeLinecap="round"
            transform="rotate(-90 40 40)"
          />
        </svg>

        <span className="balance-time">
          {Math.ceil(HOLD_SECONDS - elapsed)}s
        </span>
      </div>

      <p className="sway-label">
        Sway: <strong>{(sway * 1000).toFixed(1)}</strong>
      </p>

      <p className="task-cue">{status}</p>
    </div>
  );
}