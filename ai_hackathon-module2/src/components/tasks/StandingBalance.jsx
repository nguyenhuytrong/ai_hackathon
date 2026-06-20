import { useRef, useState, useEffect } from "react";
import { isVisible, midpoint, stdDev } from "../../utils/poseUtils";

const HOLD_SECONDS = 10;
const SWAY_THRESHOLD_MODERATE = 0.018;
const SWAY_THRESHOLD_HIGH     = 0.032;

export default function StandingBalance({ landmarks, onComplete, running }) {
  const hipXHistory = useRef([]);
  const hipYHistory = useRef([]);
  const frameCount  = useRef(0);
  const doneRef     = useRef(false);

  const [sway,    setSway]    = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [status,  setStatus]  = useState("Stand upright and hold still for 10 seconds.");

  useEffect(() => {
    if (!running || !landmarks || doneRef.current) return;

    const lHip = landmarks[23];
    const rHip = landmarks[24];
    if (!isVisible(lHip) || !isVisible(rHip)) return;

    const mid = midpoint(lHip, rHip);
    hipXHistory.current.push(mid.x);
    hipYHistory.current.push(mid.y);
    frameCount.current += 1;

    const elapsed = Math.min(frameCount.current / 30, HOLD_SECONDS); // ~30fps
    setElapsed(elapsed);

    const swayX = stdDev(hipXHistory.current.slice(-90)); // last 3 sec
    const swayY = stdDev(hipYHistory.current.slice(-90));
    const swayMag = Math.sqrt(swayX ** 2 + swayY ** 2);
    setSway(swayMag);

    if (elapsed < HOLD_SECONDS) {
      if (swayMag > SWAY_THRESHOLD_HIGH) {
        setStatus("Try to hold steadier — reach for support if needed.");
      } else if (swayMag > SWAY_THRESHOLD_MODERATE) {
        setStatus("Good — keep balancing…");
      } else {
        setStatus("Excellent steadiness!");
      }
    } else {
      if (!doneRef.current) {
        doneRef.current = true;
        const avgSway = stdDev(hipXHistory.current);
        setStatus("Balance assessed ✓");
        onComplete({
          swayMagnitude: +avgSway.toFixed(4),
          durationSec:   HOLD_SECONDS,
          difficulty:
            avgSway > SWAY_THRESHOLD_HIGH     ? "high"
            : avgSway > SWAY_THRESHOLD_MODERATE ? "moderate"
            : "low",
        });
      }
    }
  }, [landmarks, running]);

  const pct = elapsed / HOLD_SECONDS;

  return (
    <div className="task-overlay">
      <div className="balance-ring-wrap">
        <svg className="balance-ring" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#D9EDED" strokeWidth="6" />
          <circle cx="40" cy="40" r="34" fill="none"
            stroke={sway > SWAY_THRESHOLD_HIGH ? "var(--red)" : sway > SWAY_THRESHOLD_MODERATE ? "var(--amber)" : "var(--green)"}
            strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct)}`}
            strokeLinecap="round"
            transform="rotate(-90 40 40)"
          />
        </svg>
        <span className="balance-time">{Math.ceil(HOLD_SECONDS - elapsed)}s</span>
      </div>
      <p className="sway-label">
        Sway: <strong>{(sway * 1000).toFixed(1)}</strong> <span>units</span>
      </p>
      <p className="task-cue">{status}</p>
    </div>
  );
}