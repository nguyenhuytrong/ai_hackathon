import { useRef, useState, useEffect } from "react";
import { calcAngle, isVisible } from "../utils/poseUtils";

const HOLD_SECONDS = 5;

export default function ArmRaise({ landmarks, onComplete, running }) {
  const holdRef     = useRef(0);
  const frameRef    = useRef(0);
  const peakRef     = useRef({ left: 0, right: 0 });
  const [angles,    setAngles]    = useState({ left: 0, right: 0 });
  const [holdPct,   setHoldPct]   = useState(0);
  const [status,    setStatus]    = useState("Raise both arms to shoulder height.");
  const [phase,     setPhase]     = useState("idle"); // idle | holding | done

  // Shoulder flexion: angle at shoulder between elbow-shoulder-hip
  const getShoulderAngles = (lm) => {
    const result = { left: null, right: null };

    const lElbow = lm[13]; const lShoulder = lm[11]; const lHip = lm[23];
    const rElbow = lm[14]; const rShoulder = lm[12]; const rHip = lm[24];

    if (isVisible(lElbow) && isVisible(lShoulder) && isVisible(lHip))
      result.left = calcAngle(lElbow, lShoulder, lHip);
    if (isVisible(rElbow) && isVisible(rShoulder) && isVisible(rHip))
      result.right = calcAngle(rElbow, rShoulder, rHip);

    return result;
  };

  useEffect(() => {
    if (!running || !landmarks || phase === "done") return;

    const sa = getShoulderAngles(landmarks);
    setAngles({ left: sa.left ?? 0, right: sa.right ?? 0 });

    // Track peak ROM
    if (sa.left  !== null) peakRef.current.left  = Math.max(peakRef.current.left,  sa.left);
    if (sa.right !== null) peakRef.current.right = Math.max(peakRef.current.right, sa.right);

    // "Arms raised" = both shoulders > 70° from neutral
    const leftUp  = sa.left  !== null && sa.left  > 70;
    const rightUp = sa.right !== null && sa.right > 70;
    const bothUp  = leftUp && rightUp;

    frameRef.current += 1;

    if (bothUp) {
      holdRef.current += 1;
      const pct = Math.min(holdRef.current / (HOLD_SECONDS * 30), 1); // ~30fps
      setHoldPct(pct);
      setPhase("holding");
      setStatus("Hold it there…");
      if (holdRef.current >= HOLD_SECONDS * 30) {
        setPhase("done");
        setStatus("Arms assessed ✓");
        const diff = Math.abs((peakRef.current.left ?? 0) - (peakRef.current.right ?? 0));
        onComplete({
          peakLeft:     peakRef.current.left,
          peakRight:    peakRef.current.right,
          asymmetryDeg: +diff.toFixed(1),
          weakSide:     peakRef.current.left < peakRef.current.right ? "left" : "right",
          difficulty:   diff > 25 ? "high" : diff > 12 ? "moderate" : "low",
        });
      }
    } else {
      if (holdRef.current > 0) {
        holdRef.current = Math.max(0, holdRef.current - 2); // decay
        setHoldPct(holdRef.current / (HOLD_SECONDS * 30));
      }
      if (phase === "holding") setStatus("Keep both arms up!");
    }
  }, [landmarks, running, phase]);

  return (
    <div className="task-overlay">
      <div className="arm-angles">
        <div className="arm-angle-item">
          <span className="arm-label">Left</span>
          <span className="arm-deg">{angles.left}°</span>
          <div className="angle-bar">
            <div className="angle-fill" style={{ width: `${Math.min(angles.left / 180 * 100, 100)}%` }} />
          </div>
        </div>
        <div className="arm-angle-item">
          <span className="arm-label">Right</span>
          <span className="arm-deg">{angles.right}°</span>
          <div className="angle-bar">
            <div className="angle-fill" style={{ width: `${Math.min(angles.right / 180 * 100, 100)}%` }} />
          </div>
        </div>
      </div>
      {phase === "holding" && (
        <div className="hold-ring" style={{ "--pct": holdPct }}>
          <span>{Math.round(holdPct * HOLD_SECONDS)}s</span>
        </div>
      )}
      <p className="task-cue">{status}</p>
    </div>
  );
}