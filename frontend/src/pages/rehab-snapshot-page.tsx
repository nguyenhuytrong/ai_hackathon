import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Camera,
  ClipboardCheck,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { computeClinicalMovementScore, getRehabSources } from "@/lib/rehab-snapshot-engine";
import type { RehabTaskMetrics } from "@/types/carebridge";

type Screen = "landing" | "assessment" | "report";

const demoMetrics: Required<RehabTaskMetrics> = {
  sit: { reps: 3, avgTimeSec: 3.1 },
  arm: {
    peakLeft: 74,
    peakRight: 101,
    asymmetryDeg: 27,
    weakSide: "left",
  },
  balance: { swayMagnitude: 0.024, durationSec: 10 },
};

const tasks = [
  {
    id: "sit",
    title: "Sit-to-Stand",
    copy: "Observe three supported sit-to-stand repetitions.",
    metric: "3 reps, 3.1 sec average",
  },
  {
    id: "arm",
    title: "Arm Raise",
    copy: "Observe whether both arms can raise and hold near shoulder height.",
    metric: "27 deg asymmetry, left side lower",
  },
  {
    id: "balance",
    title: "Standing Balance",
    copy: "Observe steadiness during a short standing balance check.",
    metric: "10 sec hold, moderate sway",
  },
];

export default function RehabSnapshotPage() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [report, setReport] = useState<RehabTaskMetrics | null>(null);

  function completeDemoAssessment() {
    setReport(demoMetrics);
    setScreen("report");
  }

  if (screen === "assessment") {
    return (
      <section className="space-y-5">
        <Header
          eyebrow="Optional Mobility Snapshot"
          title="Guided Mobility Assessment"
          copy="Run the camera-based Module 2 flow when available. For the hackathon demo, the deterministic assessment keeps the walkthrough reliable without a second frontend or backend."
        />

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-lg border border-border bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <Camera aria-hidden="true" className="size-5 text-primary" />
              <h2 className="text-xl font-semibold tracking-normal">Assessment Tasks</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {tasks.map((task, index) => (
                <article key={task.id} className="rounded-md border border-border bg-muted/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                    Task {index + 1}
                  </p>
                  <h3 className="mt-2 font-semibold">{task.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.copy}</p>
                  <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm font-semibold">{task.metric}</p>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-lg border border-border bg-white p-5 shadow-soft">
              <h2 className="text-xl font-semibold tracking-normal">Instructions</h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                <li>Position the person so the full body is visible.</li>
                <li>Keep lighting from the front when camera mode is available.</li>
                <li>Use caregiver support nearby during standing tasks.</li>
                <li>Stop the activity if there is pain, dizziness, or discomfort.</li>
              </ol>
            </section>
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-soft">
              <h2 className="text-base font-semibold">Safety boundary</h2>
              <p className="mt-2 text-sm leading-6">
                This snapshot is an observation aid only. It is not a diagnosis and does not score
                clinical severity.
              </p>
            </section>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={completeDemoAssessment}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/25"
              >
                Use demo assessment
                <ArrowRight aria-hidden="true" className="ml-2 size-4" />
              </button>
              <button
                type="button"
                onClick={() => setScreen("landing")}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:border-primary/40 hover:bg-muted focus:outline-none focus:ring-4 focus:ring-primary/25"
              >
                Back
              </button>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  if (screen === "report" && report) {
    return <RehabSnapshotReport metrics={report} onRestart={() => setScreen("landing")} />;
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-lg border border-border bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          Mobility assessment
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal">Assess Mobility in Under 3 Minutes</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
          Bring the Module 2 mobility signal into CareBridge as an optional supporting observation
          for rehab, home-health, and transportation planning.
        </p>
        <button
          type="button"
          onClick={() => setScreen("assessment")}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/25"
        >
          Start Assessment
          <ArrowRight aria-hidden="true" className="ml-2 size-4" />
        </button>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Not a medical diagnosis. For caregiver observation and care-team discussion only.
        </p>
      </div>

      <aside className="space-y-3">
        {tasks.map((task, index) => (
          <article key={task.id} className="rounded-lg border border-border bg-white p-4 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Step {index + 1}</p>
            <h2 className="mt-2 text-lg font-semibold tracking-normal">{task.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.copy}</p>
          </article>
        ))}
      </aside>
    </section>
  );
}

function RehabSnapshotReport({
  metrics,
  onRestart,
}: {
  metrics: RehabTaskMetrics;
  onRestart: () => void;
}) {
  const score = useMemo(() => computeClinicalMovementScore(metrics), [metrics]);
  const sources = getRehabSources();

  return (
    <section className="space-y-5">
      <Header
        eyebrow="Assessment complete"
        title="Mobility Snapshot Report"
        copy="This report keeps Module 2 observations inside the main TypeScript frontend and avoids the old standalone AI backend."
      />

      <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <BarChart3 aria-hidden="true" className="size-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-normal">Clinical Movement Score</h2>
          </div>
          <p className="mt-4 text-5xl font-semibold text-primary">{score.score.toFixed(2)}</p>
          <p className="mt-2 text-sm font-semibold capitalize">{score.concern} mobility concern</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{score.summary}</p>
        </div>

        <div className="rounded-lg border border-border bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <ClipboardCheck aria-hidden="true" className="size-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-normal">CareBridge priority signal</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Sit-to-Stand" value={`${metrics.sit?.reps ?? 0}/3 reps`} />
            <Metric label="Arm Raise" value={`${metrics.arm?.asymmetryDeg ?? 0} deg asymmetry`} />
            <Metric label="Standing Balance" value={`${metrics.balance?.durationSec ?? 0} sec observed`} />
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Use this signal to discuss rehab follow-up, possible home-based support, or
            transportation planning with the care team. It does not determine support access.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-white p-5 shadow-soft">
        <h2 className="text-xl font-semibold tracking-normal">Reference sources from Module 2 logic</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {Object.entries(sources).map(([group, groupSources]) => (
            <article key={group} className="rounded-md border border-border bg-muted/40 p-4">
              <h3 className="font-semibold capitalize">{group}</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                {groupSources.map((source) => (
                  <li key={source.title}>
                    <a href={source.url} className="text-primary underline-offset-4 hover:underline">
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-soft">
        <div className="flex items-center gap-2">
          <ShieldCheck aria-hidden="true" className="size-5" />
          <h2 className="text-base font-semibold">Responsible AI reminder</h2>
        </div>
        <p className="mt-2 text-sm leading-6">
          Rehab Snapshot observations are supporting signals only. CareBridge does not provide
          medical advice or replace healthcare professionals.
        </p>
      </section>

      <button
        type="button"
        onClick={onRestart}
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:border-primary/40 hover:bg-muted focus:outline-none focus:ring-4 focus:ring-primary/25"
      >
        <RotateCcw aria-hidden="true" className="mr-2 size-4" />
        New Assessment
      </button>
    </section>
  );
}

function Header({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-6 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-normal">{title}</h1>
      <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{copy}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}
