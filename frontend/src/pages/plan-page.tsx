import { useEffect, useMemo } from "react";
import { ArrowRight, ClipboardCheck, MessageSquareText, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { ActionLink } from "@/components/action-link";
import { EmptyState, ErrorState, LoadingState } from "@/components/route-states";
import { useCareBridge } from "@/state/carebridge-context";
import type { QuestionGroups, RecommendationActionPlanItem, SupportRecommendation } from "@/types/carebridge";

const labelByTimeframe = {
  today: "Today",
  this_week: "This Week",
  next_appointment: "At Next Appointment",
};

const planLanes: Array<{ id: RecommendationActionPlanItem["timeframe"]; label: string }> = [
  { id: "today", label: "Today" },
  { id: "this_week", label: "This Week" },
  { id: "next_appointment", label: "At Next Appointment" },
];

const questionLabels: Record<keyof QuestionGroups, string> = {
  doctor: "Ask the doctor",
  therapist: "Ask the therapist",
  socialWorker: "Ask the social worker",
  insuranceProvider: "Ask the insurance provider",
};

function normalizeStep(value: string) {
  return value.trim().toLowerCase();
}

export function PlanPage() {
  const {
    error,
    isLoadingRecommendations,
    isSaving,
    loadDemoProfile,
    loadRecommendations,
    profile,
    recommendationError,
    recommendationRun,
    sessionId,
  } = useCareBridge();

  const recommendationByNextStep = useMemo(() => {
    const matches = new Map<string, SupportRecommendation>();
    recommendationRun?.recommendations.forEach((recommendation) => {
      recommendation.nextSteps.forEach((step) => {
        matches.set(normalizeStep(step), recommendation);
      });
    });
    return matches;
  }, [recommendationRun?.recommendations]);

  useEffect(() => {
    if (profile && sessionId && !recommendationRun && !isLoadingRecommendations && !recommendationError) {
      void loadRecommendations().catch(() => undefined);
    }
  }, [
    isLoadingRecommendations,
    loadRecommendations,
    profile,
    recommendationError,
    recommendationRun,
    sessionId,
  ]);

  if (!profile) {
    return (
      <EmptyState title="Action plan needs an intake profile">
        <p>Load the demo persona or complete the intake before reviewing next steps.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ActionLink to="/intake">Start Intake</ActionLink>
          <button
            type="button"
            onClick={() => void loadDemoProfile()}
            disabled={isSaving}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:border-primary/40 hover:bg-muted focus:outline-none focus:ring-4 focus:ring-primary/25"
          >
            <PlayCircle aria-hidden="true" className="mr-2 size-4" />
            {isSaving ? "Loading Demo..." : "Load Demo Persona"}
          </button>
          <ActionLink to="/benefits" variant="secondary">Review Benefits</ActionLink>
        </div>
        {error ? (
          <div className="mt-4">
            <ErrorState title="Session request failed">
              <p>{error}</p>
            </ErrorState>
          </div>
        ) : null}
      </EmptyState>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-border bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          Practical support plan
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Your Next Steps This Week</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          A checklist for organizing calls, documents, and questions before the next care team
          conversation.
        </p>
      </div>

      {isLoadingRecommendations ? <LoadingState title="Preparing action plan" /> : null}

      {recommendationError ? (
        <ErrorState title="Recommendation request failed">
          <p>{recommendationError}</p>
        </ErrorState>
      ) : null}

      {!isLoadingRecommendations && !recommendationError && !recommendationRun ? (
        <EmptyState title="No action plan generated yet">
          <p>CareBridge needs to generate support matches before showing a plan.</p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => void loadRecommendations()}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/25"
            >
              Generate Support Matches
            </button>
          </div>
        </EmptyState>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {planLanes.map((lane) => {
          const laneItems = recommendationRun?.actionPlan.filter((item) => item.timeframe === lane.id) ?? [];

          return (
            <section key={lane.id} className="rounded-lg border border-border bg-white p-5 shadow-soft">
              <h2 className="text-xl font-semibold tracking-normal">{lane.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{laneIntroCopy[lane.id]}</p>
              <div className="mt-5 space-y-4">
                {laneItems.length > 0 ? (
                  laneItems.map((item) => (
                    <ActionPlanCard
                      key={item.title}
                      item={item}
                      matchedRecommendation={recommendationByNextStep.get(normalizeStep(item.title))}
                    />
                  ))
                ) : (
                  <p className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
                    No action items in this lane yet.
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <section className="rounded-lg border border-border bg-white p-6 shadow-soft">
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-normal">
          <MessageSquareText aria-hidden="true" className="size-6 text-primary" />
          Questions to Ask
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {Object.entries(recommendationRun?.questionsToAsk ?? {}).map(([group, questions]) => (
            <article key={group} className="rounded-md border border-border bg-muted/40 p-4">
              <h3 className="font-semibold">{questionLabels[group as keyof QuestionGroups]}</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                {questions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

const laneIntroCopy: Record<RecommendationActionPlanItem["timeframe"], string> = {
  today: "Calls and documents to start now.",
  this_week: "Follow-ups to organize before schedules get busy.",
  next_appointment: "Questions to bring into the next care conversation.",
};

function ActionPlanCard({
  item,
  matchedRecommendation,
}: {
  item: RecommendationActionPlanItem;
  matchedRecommendation?: SupportRecommendation;
}) {
  return (
    <article className="rounded-md border border-border bg-muted/30 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
        <ClipboardCheck aria-hidden="true" className="size-4" />
        Priority {item.priority} | {labelByTimeframe[item.timeframe]}
      </p>
      <h3 className="mt-3 text-base font-semibold leading-6">{item.title}</h3>
      {matchedRecommendation ? (
        <Link
          to={`/resources/${matchedRecommendation.id}`}
          state={{ recommendation: matchedRecommendation }}
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline focus:outline-none focus:ring-4 focus:ring-primary/25"
        >
          View resource details
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
      <ul className="mt-4 space-y-3">
        {item.checklist.map((task) => (
          <li key={task} className="flex gap-3 text-sm leading-6">
            <input
              aria-label={task}
              type="checkbox"
              className="mt-1 size-4 rounded border-border text-primary focus:ring-primary"
            />
            <span>{task}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
