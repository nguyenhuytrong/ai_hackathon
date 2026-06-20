import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  HelpCircle,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getResource } from "@/api/client";
import { EmptyState, ErrorState, LoadingState } from "@/components/route-states";
import { StatusBadge } from "@/components/status-badge";
import { useCareBridge } from "@/state/carebridge-context";
import type { QuestionGroups, ResourceDetail, SupportRecommendation } from "@/types/carebridge";

type ResourceLocationState = {
  recommendation?: SupportRecommendation;
};

const questionLabels: Record<keyof QuestionGroups, string> = {
  doctor: "Doctor",
  therapist: "Therapist",
  socialWorker: "Social worker",
  insuranceProvider: "Insurance provider",
};

export function ResourceDetailPage() {
  const { resourceId } = useParams();
  const location = useLocation();
  const { recommendationRun } = useCareBridge();
  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stateRecommendation = (location.state as ResourceLocationState | null)?.recommendation;
  const recommendation = useMemo(
    () =>
      stateRecommendation ??
      recommendationRun?.recommendations.find((candidate) => candidate.id === resourceId) ??
      null,
    [recommendationRun?.recommendations, resourceId, stateRecommendation],
  );

  useEffect(() => {
    if (!resourceId) {
      setError("Resource not found");
      setIsLoading(false);
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setError(null);

    getResource(resourceId)
      .then((nextResource) => {
        if (isActive) {
          setResource(nextResource);
        }
      })
      .catch((nextError: unknown) => {
        if (isActive) {
          setError(nextError instanceof Error ? nextError.message : "Resource detail could not load.");
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [resourceId]);

  if (isLoading) {
    return <LoadingState title="Loading resource details" />;
  }

  if (error) {
    return (
      <ErrorState title="Resource detail request failed">
        <p>{error}</p>
      </ErrorState>
    );
  }

  if (!resource) {
    return (
      <EmptyState title="Resource not found">
        <p>CareBridge could not find this support pathway.</p>
      </EmptyState>
    );
  }

  const whyThisMayFit = recommendation?.whyThisMayFit?.length
    ? recommendation.whyThisMayFit
    : recommendation?.matchedFactors ?? [];
  const questions = recommendationRun?.questionsToAsk;

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-border bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              {resource.category.replace("_", " ")}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">{resource.name}</h1>
            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{resource.description}</p>
            {resource.location ? (
              <p className="mt-3 text-sm font-semibold text-foreground">{resource.location}</p>
            ) : null}
          </div>
          {recommendation ? <StatusBadge status={recommendation.matchStatus} /> : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <DetailSection title="Why this may fit" icon="check" items={whyThisMayFit} />
          <DetailSection
            title="Information to confirm"
            icon="question"
            items={recommendation?.missingInformation ?? []}
            emptyCopy="Generate recommendations from Benefits to see the missing information CareBridge found."
          />
          <DetailSection title="Eligibility factors considered" icon="shield" items={resource.eligibilityFactors} />
          <DetailSection title="Documents to prepare" icon="file" items={resource.documentsToPrepare} />
          <DetailSection title="Next steps" icon="clipboard" items={resource.steps} />
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-border bg-white p-5 shadow-soft">
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-normal">
              <MessageSquareText aria-hidden="true" className="size-5 text-primary" />
              Questions
            </h2>
            {questions ? (
              <div className="mt-4 space-y-4">
                {Object.entries(questions).map(([group, items]) => (
                  <div key={group} className="rounded-md border border-border bg-muted/40 p-3">
                    <h3 className="text-sm font-semibold">
                      {questionLabels[group as keyof QuestionGroups]}
                    </h3>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
                      {items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Generate support matches to see stakeholder questions for this resource.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-border bg-white p-5 shadow-soft">
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-normal">
              <FileText aria-hidden="true" className="size-5 text-primary" />
              Sources
            </h2>
            {resource.sources.length > 0 ? (
              <div className="mt-4 space-y-4">
                {resource.sources.map((source) => (
                  <article key={source.sourceId} className="rounded-md border border-primary/20 bg-primary/5 p-3">
                    <p className="font-semibold">{source.title}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {source.sourceType.replace("_", " ")} | {source.authorityLevel.replace("_", " ")}
                      {source.page ? ` | Page ${source.page}` : ""}
                    </p>
                    {source.excerpt ? (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{source.excerpt}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                      <Link
                        to={`/sources/${source.sourceId}`}
                        className="text-primary underline-offset-4 hover:underline focus:outline-none focus:ring-4 focus:ring-primary/25"
                      >
                        Open source detail
                      </Link>
                      {source.url ? (
                        <a
                          href={source.url}
                          className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline focus:outline-none focus:ring-4 focus:ring-primary/25"
                        >
                          Publisher page
                          <ExternalLink aria-hidden="true" className="size-3.5" />
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                No stored source excerpts are linked to this resource yet.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-soft">
            <h2 className="text-base font-semibold">Responsible AI reminder</h2>
            <p className="mt-2 text-sm leading-6">
              CareBridge does not determine final eligibility, does not provide medical advice, and does
              not replace healthcare professionals or program administrators.
            </p>
          </section>
        </aside>
      </div>
    </section>
  );
}

function DetailSection({
  title,
  items,
  icon,
  emptyCopy = "CareBridge does not have details for this section yet.",
}: {
  title: string;
  items: string[];
  icon: "check" | "question" | "file" | "clipboard" | "shield";
  emptyCopy?: string;
}) {
  const Icon =
    icon === "check"
      ? CheckCircle2
      : icon === "question"
        ? HelpCircle
        : icon === "file"
          ? FileText
          : icon === "shield"
            ? ShieldCheck
            : ClipboardList;

  return (
    <section className="rounded-lg border border-border bg-white p-5 shadow-soft">
      <h2 className="flex items-center gap-2 text-xl font-semibold tracking-normal">
        <Icon aria-hidden="true" className="size-5 text-primary" />
        {title}
      </h2>
      {items.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{emptyCopy}</p>
      )}
    </section>
  );
}
