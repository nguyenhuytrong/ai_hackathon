import { useEffect, useMemo, useState } from "react";
import { searchEvidence } from "@/api/client";
import { ActionLink } from "@/components/action-link";
import { EmptyState, ErrorState, LoadingState } from "@/components/route-states";
import { SupportCard } from "@/components/support-card";
import { useCareBridge } from "@/state/carebridge-context";
import type { RagSearchResponse } from "@/types/carebridge";

export function BenefitsPage() {
  const [evidenceSearch, setEvidenceSearch] = useState<RagSearchResponse | null>(null);
  const [isEvidenceLoading, setIsEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
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

  const evidenceQuery = useMemo(() => {
    const firstRecommendation = recommendationRun?.recommendations[0];
    if (!firstRecommendation) {
      return null;
    }

    return `${firstRecommendation.title} ${firstRecommendation.nextSteps.join(" ")}`;
  }, [recommendationRun]);

  useEffect(() => {
    const firstRecommendation = recommendationRun?.recommendations[0];
    if (!firstRecommendation || !evidenceQuery || evidenceSearch || evidenceError || isEvidenceLoading) {
      return;
    }

    setIsEvidenceLoading(true);
    void searchEvidence({
      query: evidenceQuery,
      filters: { category: firstRecommendation.category },
      topK: 3,
    })
      .then((response) => {
        setEvidenceSearch(response);
      })
      .catch((nextError: unknown) => {
        setEvidenceError(
          nextError instanceof Error ? nextError.message : "CareBridge could not search source evidence.",
        );
      })
      .finally(() => {
        setIsEvidenceLoading(false);
      });
  }, [
    evidenceError,
    evidenceQuery,
    evidenceSearch,
    isEvidenceLoading,
    recommendationRun,
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

      {recommendationRun ? (
        <section className="rounded-lg border border-border bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Retrieval Check
              </p>
              <h2 className="text-2xl font-semibold tracking-normal">Evidence Search</h2>
            </div>
            {isEvidenceLoading ? (
              <p className="text-sm font-semibold text-primary">Searching sources...</p>
            ) : null}
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            CareBridge searches ingested source chunks and shows citation-ready snippets separately
            from the support match language.
          </p>

          {evidenceError ? (
            <div className="mt-4">
              <ErrorState title="Evidence search failed">
                <p>{evidenceError}</p>
              </ErrorState>
            </div>
          ) : null}

          {!isEvidenceLoading && evidenceSearch && evidenceSearch.results.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No source chunks found">
                <p>Try completing more intake details or running ingestion with trusted sources.</p>
              </EmptyState>
            </div>
          ) : null}

          {evidenceSearch && evidenceSearch.results.length > 0 ? (
            <div className="mt-4 space-y-3">
              {evidenceSearch.results.map((result) => (
                <article
                  key={result.chunkId}
                  className="rounded-md border border-border bg-muted/40 p-3 text-sm leading-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">{result.source.title}</p>
                    <p className="font-semibold text-primary">Score {result.score.toFixed(2)}</p>
                  </div>
                  <p className="mt-1 text-muted-foreground">{result.text}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
