import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { demoProfile } from "@/data/mock-carebridge";
import { useCareBridge } from "@/state/carebridge-context";
import type { IntakeProfile } from "@/types/carebridge";

type IntakeStep = {
  key: keyof IntakeProfile;
  title: string;
  question: string;
  options: Array<{ label: string; value: string | boolean }>;
  why: string;
};

const intakeSteps: IntakeStep[] = [
  {
    key: "dischargeTime",
    title: "Discharge context",
    question: "When was your loved one discharged?",
    options: [
      { label: "Less than 7 days ago", value: "less_than_7_days" },
      { label: "One to four weeks ago", value: "one_to_four_weeks" },
      { label: "More than one month ago", value: "more_than_one_month" },
      { label: "Not sure", value: "not_sure" },
    ],
    why: "Timing can affect which support conversations are most urgent.",
  },
  {
    key: "mobility",
    title: "Mobility",
    question: "How much mobility support is needed right now?",
    options: [
      { label: "Independent", value: "independent" },
      { label: "Needs some assistance", value: "needs_some_assistance" },
      { label: "Needs substantial assistance", value: "needs_substantial_assistance" },
      { label: "Not sure", value: "not_sure" },
    ],
    why: "Mobility needs can shape rehab, home health, and equipment conversations.",
  },
  {
    key: "transportation",
    title: "Transportation",
    question: "Can your loved one attend appointments easily?",
    options: [
      { label: "Transportation available", value: "available" },
      { label: "No vehicle", value: "no_vehicle" },
      { label: "Cannot drive", value: "cannot_drive" },
      { label: "Need transportation support", value: "need_support" },
      { label: "Not sure", value: "not_sure" },
    ],
    why: "Transportation barriers can affect follow-up care and support planning.",
  },
  {
    key: "insurance",
    title: "Insurance",
    question: "Which insurance pathway applies?",
    options: [
      { label: "Medicare", value: "medicare" },
      { label: "Medicaid", value: "medicaid" },
      { label: "Private insurance", value: "private" },
      { label: "Uninsured", value: "uninsured" },
      { label: "Not sure", value: "not_sure" },
    ],
    why: "Some next steps depend on insurance or program administrator rules.",
  },
  {
    key: "caregiverBurden",
    title: "Caregiver situation",
    question: "How heavy does the caregiving load feel this week?",
    options: [
      { label: "Low", value: "low" },
      { label: "Moderate", value: "moderate" },
      { label: "Elevated", value: "elevated" },
      { label: "High", value: "high" },
      { label: "Not sure", value: "not_sure" },
    ],
    why: "Caregiver strain can point to respite, community, and social-work support conversations.",
  },
  {
    key: "biggestChallenge",
    title: "Support pressure",
    question: "What feels hardest to solve first?",
    options: [
      { label: "Getting to appointments", value: "getting_to_appointments" },
      { label: "Scheduling rehab", value: "scheduling_rehab" },
      { label: "Caregiver time", value: "caregiver_time" },
      { label: "Understanding paperwork", value: "understanding_paperwork" },
      { label: "Not sure", value: "not_sure" },
    ],
    why: "CareBridge uses the biggest current challenge to prioritize the support plan.",
  },
];

export function IntakePage() {
  const { updateProfile } = useCareBridge();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<IntakeProfile>({
    caregiverName: "John",
    careRecipient: "Mother",
    state: "OH",
    county: "Montgomery County, OH",
    caregiverWorking: true,
  });
  const [completed, setCompleted] = useState(false);

  const step = intakeSteps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / intakeSteps.length) * 100);
  const considerations = useMemo(
    () => ["Mobility needs", "Transportation barriers", "Insurance pathway", "Caregiver burden", "Possible support programs"],
    [],
  );

  function selectOption(value: string | boolean) {
    const nextAnswers = { ...answers, [step.key]: value };
    setAnswers(nextAnswers);

    if (stepIndex === intakeSteps.length - 1) {
      updateProfile({ ...demoProfile, ...nextAnswers });
      setCompleted(true);
      return;
    }

    setStepIndex((current) => current + 1);
  }

  if (completed) {
    return (
      <section className="rounded-lg border border-border bg-white p-6 shadow-soft">
        <CheckCircle2 aria-hidden="true" className="mb-4 size-9 text-emerald-700" />
        <h1 className="text-3xl font-semibold tracking-normal">Intake profile saved for this demo</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
          CareBridge has enough mock intake information to show possible support matches. This stays
          local in the browser until the Phase 2 backend is connected.
        </p>
        <Link
          to="/benefits"
          className="mt-5 inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/25"
        >
          View Benefits
          <ArrowRight aria-hidden="true" className="ml-2 size-4" />
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-lg border border-border bg-white p-6 shadow-soft">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Step {stepIndex + 1} of {intakeSteps.length}
          </p>
          <div className="mt-3 h-2 rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <h1 className="text-3xl font-semibold tracking-normal">{step.title}</h1>
        <p className="mt-3 text-xl leading-8 text-muted-foreground">{step.question}</p>
        <p className="mt-3 rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
          Why we ask: {step.why}
        </p>

        <div className="mt-6 grid gap-3">
          {step.options.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => selectOption(option.value)}
              className="min-h-12 cursor-pointer rounded-md border border-border bg-white px-4 py-3 text-left font-semibold transition-colors duration-200 hover:border-primary/50 hover:bg-muted focus:outline-none focus:ring-4 focus:ring-primary/25"
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <aside className="rounded-lg border border-border bg-white p-5 shadow-soft">
        <h2 className="text-xl font-semibold tracking-normal">CareBridge is considering</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          These are visible factors only, not hidden reasoning.
        </p>
        <ul className="mt-4 space-y-3">
          {considerations.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm font-medium">
              <CheckCircle2 aria-hidden="true" className="size-4 text-emerald-700" />
              {item}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
