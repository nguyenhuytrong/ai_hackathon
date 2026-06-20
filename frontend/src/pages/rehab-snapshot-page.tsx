import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
  VideoOff,
} from "lucide-react";
import { ActionLink } from "@/components/action-link";
import { EmptyState, ErrorState, LoadingState } from "@/components/route-states";
import { useCareBridge } from "@/state/carebridge-context";
import type { RehabSnapshotRequest, RehabTaskMetrics } from "@/types/carebridge";

const POSE_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404";
const CAMERA_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862";
const DRAWING_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1675466124";

const demoMetrics: RehabTaskMetrics = {
  sit: { reps: 3, avgTimeSec: 3.1, difficulty: "moderate" },
  arm: {
    peakLeft: 74,
    peakRight: 101,
    asymmetryDeg: 27,
    weakSide: "left",
    difficulty: "high",
  },
  balance: { swayMagnitude: 0.024, durationSec: 10, difficulty: "moderate" },
};

const assessmentTasks = [
  {
    id: "sit" as const,
    title: "Sit-to-Stand",
    description: "Sit, then stand three times with any normal support.",
    metric: demoMetrics.sit,
  },
  {
    id: "arm" as const,
    title: "Arm Raise",
    description: "Lift both arms and hold near shoulder height for five seconds.",
    metric: demoMetrics.arm,
  },
  {
    id: "balance" as const,
    title: "Standing Balance",
    description: "Stand still for ten seconds with support nearby.",
    metric: demoMetrics.balance,
  },
];

const taskCards = [
  {
    title: "Sit-to-Stand",
    description: "Observe three supported sit-to-stand repetitions.",
  },
  {
    title: "Arm Raise",
    description: "Observe whether both arms can raise and hold near shoulder height.",
  },
  {
    title: "Standing Balance",
    description: "Observe steadiness during a short standing balance check.",
  },
];

export function RehabSnapshotPage() {
  const {
    isLoadingRecommendations,
    isSaving,
    isSavingRehabSnapshot,
    loadDemoProfile,
    profile,
    rehabSnapshotError,
    saveRehabSnapshot,
    sessionId,
  } = useCareBridge();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [draftSnapshot, setDraftSnapshot] = useState<RehabSnapshotRequest | null>(null);
  const [poseStatus, setPoseStatus] = useState<"idle" | "loading" | "ready" | "fallback">("idle");
  const [poseWarning, setPoseWarning] = useState<string | null>(null);
  const [taskIndex, setTaskIndex] = useState(0);
  const [taskResults, setTaskResults] = useState<Partial<RehabTaskMetrics>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraReady]);

  const concernLabel = useMemo(() => {
    if (!draftSnapshot) {
      return null;
    }
    return labelByConcern[draftSnapshot.mobilityConcern];
  }, [draftSnapshot]);

  const currentTask = assessmentTasks[taskIndex];

  if (!profile || !sessionId) {
    return (
      <EmptyState title="Mobility snapshot needs an intake profile">
        <p>Load the demo persona or complete intake before adding Module 2 mobility observations.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ActionLink to="/intake">Start Intake</ActionLink>
          <button
            type="button"
            onClick={() => void loadDemoProfile()}
            disabled={isSaving}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:border-primary/40 hover:bg-muted focus:outline-none focus:ring-4 focus:ring-primary/25"
          >
            {isSaving ? "Loading Demo..." : "Load Demo Persona"}
          </button>
        </div>
      </EmptyState>
    );
  }

  async function startCameraAssessment() {
    setCameraError(null);
    setPoseWarning(null);
    setTaskIndex(0);
    setTaskResults({});
    setDraftSnapshot(null);
    setSaved(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not available in this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setCameraReady(true);
      setPoseStatus("loading");
      loadMediaPipeRuntime()
        .then(() => {
          setPoseStatus("ready");
        })
        .catch(() => {
          setPoseStatus("fallback");
          setPoseWarning("MediaPipe pose engine could not load. Continue with guided demo metrics or use the demo snapshot.");
        });
    } catch (error) {
      setCameraReady(false);
      setPoseStatus("idle");
      setCameraError(error instanceof Error ? error.message : "Camera access could not be started.");
    }
  }

  function useDemoSnapshot() {
    setSaved(false);
    setTaskIndex(assessmentTasks.length - 1);
    setTaskResults(demoMetrics);
    setDraftSnapshot(snapshotFromMetrics(demoMetrics));
  }

  function recordCurrentTask() {
    const nextResults = {
      ...taskResults,
      [currentTask.id]: currentTask.metric,
    };
    setTaskResults(nextResults);
    setSaved(false);

    if (taskIndex < assessmentTasks.length - 1) {
      setTaskIndex((index) => index + 1);
      return;
    }

    setDraftSnapshot(snapshotFromMetrics(nextResults));
  }

  async function updateSupportPlan() {
    if (!draftSnapshot) {
      return;
    }
    setSaved(false);
    try {
      await saveRehabSnapshot(draftSnapshot);
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-border bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          Optional Mobility Snapshot
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Rehab Snapshot</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Add Module 2 mobility observations as a supporting signal for rehab, home-health, and
          transportation planning. This does not provide medical advice or replace the care team.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-border bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-normal">
                <Camera aria-hidden="true" className="size-6 text-primary" />
                Mobility Assessment
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Run the camera check when available, or use the deterministic demo snapshot for a
                reliable judging flow.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void startCameraAssessment()}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/25"
              >
                <Camera aria-hidden="true" className="size-4" />
                Start camera assessment
              </button>
              <button
                type="button"
                onClick={useDemoSnapshot}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:border-primary/40 hover:bg-muted focus:outline-none focus:ring-4 focus:ring-primary/25"
              >
                <Activity aria-hidden="true" className="size-4" />
                Use demo mobility snapshot
              </button>
            </div>
          </div>

          {cameraError ? (
            <div role="status" className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-950">
              <div className="flex gap-3">
                <VideoOff aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="font-semibold">Camera assessment is unavailable</p>
                  <p className="mt-1 text-sm leading-6">{cameraError}</p>
                </div>
              </div>
            </div>
          ) : null}

          {cameraReady ? (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="relative overflow-hidden rounded-md bg-slate-900">
                <video ref={videoRef} className="aspect-video w-full" autoPlay muted playsInline />
                <canvas
                  ref={canvasRef}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  width={640}
                  height={480}
                />
              </div>
              <div className="mt-4 rounded-md border border-border bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                      {poseStatus === "loading"
                        ? "Loading pose engine"
                        : poseStatus === "ready"
                          ? "Pose engine ready"
                          : poseStatus === "fallback"
                            ? "Fallback metrics active"
                            : "Camera ready"}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{currentTask.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{currentTask.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={recordCurrentTask}
                    className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/25"
                  >
                    {taskIndex === assessmentTasks.length - 1 ? "Complete guided assessment" : `Record ${currentTask.title}`}
                  </button>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {assessmentTasks.map((task, index) => (
                    <div
                      key={task.id}
                      className={`rounded-md border px-3 py-2 text-sm ${
                        index < taskIndex
                          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                          : index === taskIndex
                            ? "border-primary/40 bg-primary/5 text-primary"
                            : "border-border bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <p className="font-semibold">{task.title}</p>
                      <p className="mt-1 text-xs">{index < taskIndex ? "Recorded" : index === taskIndex ? "Current task" : "Pending"}</p>
                    </div>
                  ))}
                </div>
              </div>
              {poseWarning ? (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                  {poseWarning}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {taskCards.map((task, index) => (
              <article key={task.title} className="rounded-md border border-border bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                  Task {index + 1}
                </p>
                <h3 className="mt-2 font-semibold">{task.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.description}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          {draftSnapshot ? (
            <section className="rounded-lg border border-border bg-white p-5 shadow-soft">
              <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-normal">
                <ClipboardCheck aria-hidden="true" className="size-6 text-primary" />
                Optional Mobility Snapshot
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4 rounded-md bg-muted/40 px-3 py-2">
                  <dt className="text-muted-foreground">Mobility Concern</dt>
                  <dd className="font-semibold">{concernLabel}</dd>
                </div>
                <div className="rounded-md bg-muted/40 px-3 py-2">
                  <dt className="text-muted-foreground">Observed</dt>
                  <dd className="mt-2">
                    <ul className="space-y-1">
                      {draftSnapshot.observations.map((observation) => (
                        <li key={observation}>{observation}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => void updateSupportPlan()}
                disabled={isSavingRehabSnapshot || isLoadingRecommendations}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingRehabSnapshot || isLoadingRecommendations ? "Updating Support Plan..." : "Update Support Plan"}
                <ArrowRight aria-hidden="true" className="size-4" />
              </button>
            </section>
          ) : (
            <section className="rounded-lg border border-dashed border-border bg-white p-5 shadow-soft">
              <h2 className="flex items-center gap-2 text-xl font-semibold tracking-normal">
                <Activity aria-hidden="true" className="size-5 text-primary" />
                Snapshot not created yet
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Start the camera assessment or load the deterministic demo snapshot to preview the
                support-plan update.
              </p>
            </section>
          )}

          {isSavingRehabSnapshot || isLoadingRecommendations ? (
            <LoadingState title="Updating support plan" />
          ) : null}

          {rehabSnapshotError ? (
            <ErrorState title="Rehab snapshot request failed">
              <p>{rehabSnapshotError}</p>
            </ErrorState>
          ) : null}

          {saved ? (
            <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-soft">
              <h2 className="flex items-center gap-2 text-xl font-semibold tracking-normal">
                <CheckCircle2 aria-hidden="true" className="size-5" />
                Care Plan Updated with Rehab Data
              </h2>
              <p className="mt-3 text-sm leading-6">
                Rehab follow-up moved into the first support priority. Ask the therapist whether
                home-based rehab or mobility support should be considered.
              </p>
            </section>
          ) : null}

          <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-soft">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck aria-hidden="true" className="size-5" />
              Responsible AI reminder
            </h2>
            <p className="mt-2 text-sm leading-6">
              Rehab Snapshot observations are supporting signals only. CareBridge does not provide
              medical advice or replace healthcare professionals.
            </p>
          </section>
        </aside>
      </div>
    </section>
  );
}

const labelByConcern: Record<RehabSnapshotRequest["mobilityConcern"], string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  unable_to_assess: "Unable to assess",
};

function snapshotFromMetrics(metrics: Partial<RehabTaskMetrics>): RehabSnapshotRequest {
  const highCount = [metrics.sit, metrics.arm, metrics.balance].filter(
    (task) => task?.difficulty === "high",
  ).length;
  const moderateCount = [metrics.sit, metrics.arm, metrics.balance].filter(
    (task) => task?.difficulty === "moderate",
  ).length;

  const mobilityConcern =
    highCount >= 2 ? "high" : highCount >= 1 || moderateCount >= 2 ? "moderate" : "low";

  return {
    mobilityConcern,
    observations: [
      "Difficulty standing",
      "Reduced arm movement",
      "Standing balance may need support",
    ],
    confidence: "medium",
    capturedAt: new Date().toISOString(),
  };
}

function loadMediaPipeRuntime() {
  return Promise.all([
    loadScript(`${POSE_CDN}/pose.js`),
    loadScript(`${CAMERA_CDN}/camera_utils.js`),
    loadScript(`${DRAWING_CDN}/drawing_utils.js`),
  ]);
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Unable to load ${src}`));
    document.head.appendChild(script);
  });
}
