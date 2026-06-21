import { CheckCircle2, ExternalLink, FileText, HelpCircle } from "lucide-react";
import { StatusBadge } from "./status-badge";
import type { SupportRecommendation } from "@/types/carebridge";

export function SupportCard({
  recommendation,
  showStillMissingLabel = false,
}: {
  recommendation: SupportRecommendation;
  showStillMissingLabel?: boolean;
}) {
  const fitItems =
    recommendation.whyThisMayFit && recommendation.whyThisMayFit.length > 0
      ? recommendation.whyThisMayFit
      : recommendation.matchedFactors;
  const evidenceItems = recommendation.evidenceSummary ?? [];
  const sources = recommendation.sources ?? [];

  return (
    <article className="rounded-lg border border-border bg-white p-5 shadow-soft">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {recommendation.category.replace("_", " ")}
          </p>
          <h2 className="text-2xl font-semibold tracking-normal">
            {recommendation.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Evidence status:{" "}
            {recommendation.evidenceStatus === "grounded"
              ? "Grounded with sources"
              : "Needs more evidence"}
          </p>
        </div>
        <StatusBadge status={recommendation.matchStatus} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="Why CareBridge recommends this"
          icon="check"
          items={fitItems}
        />
        <Section
          title={
            showStillMissingLabel ? "Still missing" : "Information to confirm"
          }
          icon="question"
          items={recommendation.missingInformation}
        />
        <Section
          title="Documents to prepare"
          icon="source"
          items={recommendation.documentsToPrepare}
        />
        <Section
          title="Next step"
          icon="check"
          items={recommendation.nextSteps}
        />
        {evidenceItems.length > 0 ? (
          <Section
            title="Evidence summary"
            icon="source"
            items={evidenceItems}
          />
        ) : null}
        {recommendation.questionsToAsk &&
        recommendation.questionsToAsk.length > 0 ? (
          <Section
            title="Questions to ask"
            icon="question"
            items={recommendation.questionsToAsk}
          />
        ) : null}
      </div>

      <div className="mt-4 rounded-md border border-dashed border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
        {sources.length > 0 ? (
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Sources used</p>
            <ul className="space-y-2">
              {sources.map((source) => (
                <li key={source.sourceId}>
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {source.title}
                      <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="font-medium text-foreground">
                      {source.title}
                    </span>
                  )}
                  {source.excerpt ? (
                    <p className="mt-1 line-clamp-2">{source.excerpt}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>
            Source evidence will be added when trusted documents are available
            for this support pathway.
          </p>
        )}
      </div>
    </article>
  );
}

function Section({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: "check" | "question" | "source";
}) {
  const Icon =
    icon === "check"
      ? CheckCircle2
      : icon === "question"
        ? HelpCircle
        : FileText;

  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon aria-hidden="true" className="size-4 text-primary" />
        {title}
      </h3>
      <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
