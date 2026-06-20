import { useEffect } from "react";
import { ActionLink } from "@/components/action-link";
import { EmptyState, ErrorState, LoadingState } from "@/components/route-states";
import { SupportCard } from "@/components/support-card";
import { useCareBridge } from "@/state/carebridge-context";

export function BenefitsPage() {
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
      <EmptyState title="No intake profile loaded">
        <p>Start the intake or load the demo persona to see placeholder support matches.</p>
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
          Potential Support Matches
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Support You May Explore</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          These cards interpret the saved intake profile and show what information still needs to be
          confirmed before discussing support options with professionals or program administrators.
        </p>
      </div>

      {isLoadingRecommendations ? <LoadingState title="Generating support matches" /> : null}

      {recommendationError ? (
        <ErrorState title="Recommendation request failed">
          <p>{recommendationError}</p>
        </ErrorState>
      ) : null}

      {!isLoadingRecommendations && !recommendationError && !recommendationRun ? (
        <EmptyState title="No support matches generated yet">
          <p>CareBridge needs to generate a recommendation run for this session.</p>
        </EmptyState>
      ) : null}

      {recommendationRun?.recommendations.map((recommendation, index) => (
        <SupportCard
          key={recommendation.id}
          recommendation={recommendation}
          showStillMissingLabel={index === 0}
        />
      ))}
    </section>
  );
}
