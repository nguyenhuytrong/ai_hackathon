import { useEffect, useRef, useCallback } from "react";

const POSE_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404";
const CAMERA_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862";
const DRAWING_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1675466124";

function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement("script");
    s.src = src; s.crossOrigin = "anonymous";
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

/**
 * usePose — attaches MediaPipe Pose to a <video> and <canvas> ref.
 * Calls onResults(landmarks, canvasElement) each frame.
 */
export default function usePose({ videoRef, canvasRef, onResults, enabled = true }) {
  const poseRef   = useRef(null);
  const cameraRef = useRef(null);
  const cbRef     = useRef(onResults);
  cbRef.current = onResults;

  const drawSkeleton = useCallback((landmarks, canvas) => {
    if (!window.drawConnectors || !window.drawLandmarks) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    window.drawConnectors(ctx, landmarks, window.POSE_CONNECTIONS,
      { color: "#14A8AD", lineWidth: 2.5 });
    window.drawLandmarks(ctx, landmarks,
      { color: "#0D7377", fillColor: "#fff", lineWidth: 1.5, radius: 4 });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function init() {
      await loadScript(`${POSE_CDN}/pose.js`);
      await loadScript(`${CAMERA_CDN}/camera_utils.js`);
      await loadScript(`${DRAWING_CDN}/drawing_utils.js`);
      if (cancelled) return;

      const pose = new window.Pose({
        locateFile: (f) => `${POSE_CDN}/${f}`,
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.55,
      });
      pose.onResults((results) => {
        if (cancelled) return;
        if (results.poseLandmarks && canvasRef.current) {
          drawSkeleton(results.poseLandmarks, canvasRef.current);
        }
        cbRef.current?.(results.poseLandmarks || null);
      });
      poseRef.current = pose;

      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (poseRef.current && videoRef.current) {
            await poseRef.current.send({ image: videoRef.current });
          }
        },
        width: 640, height: 480,
      });
      camera.start();
      cameraRef.current = camera;
    }

    init().catch(console.error);

    return () => {
      cancelled = true;
      cameraRef.current?.stop();
      poseRef.current?.close();
    };
  }, [enabled]);
}