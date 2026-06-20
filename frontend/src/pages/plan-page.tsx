import { useEffect } from "react";
import { ClipboardCheck, MessageSquareText } from "lucide-react";
import { ActionLink } from "@/components/action-link";
import { EmptyState, ErrorState, LoadingState } from "@/components/route-states";
import { useCareBridge } from "@/state/carebridge-context";

const labelByTimeframe = {
  today: "Today",
  this_week: "This Week",
  next_appointment: "At Next Appointment",
};

export function PlanPage() {
  const {
    isLoadingRecommendations,
    loadRecommendations,
    profile,
    recommendationError,
    recommendationRun,
    sessionId,
  } = useCareBridge();

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
        <div className="mt-4">
          <ActionLink to="/benefits">Review Benefits</ActionLink>
        </div>
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
        </EmptyState>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {recommendationRun?.actionPlan.map((item) => (
          <article key={item.title} className="rounded-lg border border-border bg-white p-5 shadow-soft">
            <p className="text-sm font-semibold text-primary">{labelByTimeframe[item.timeframe]}</p>
            <h2 className="mt-2 text-xl font-semibold tracking-normal">{item.title}</h2>
            <p className="mt-4 flex items-center gap-2 text-sm font-semibold">
              <ClipboardCheck aria-hidden="true" className="size-4 text-primary" />
              Priority {item.priority}
            </p>
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
        ))}
      </div>

      <section className="rounded-lg border border-border bg-white p-6 shadow-soft">
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-normal">
          <MessageSquareText aria-hidden="true" className="size-6 text-primary" />
          Questions to Ask
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {Object.entries(recommendationRun?.questionsToAsk ?? {}).map(([group, questions]) => (
            <article key={group} className="rounded-md border border-border bg-muted/40 p-4">
              <h3 className="font-semibold capitalize">
                Ask the {group.replace(/([A-Z])/g, " $1").toLowerCase()}
              </h3>
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
