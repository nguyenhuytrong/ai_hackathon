import { ArrowRight, CheckCircle2, FileText, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
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
  const sources = recommendation.sources ?? [];
  const sourceCopy =
    recommendation.sourcePlaceholder ??
    (sources.length > 0
      ? null
      : "Source evidence is not yet strong enough for this recommendation.");

  return (
    <article className="rounded-lg border border-border bg-white p-5 shadow-soft">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {recommendation.category.replace("_", " ")}
          </p>
          <h2 className="text-2xl font-semibold tracking-normal">{recommendation.title}</h2>
        </div>
        <StatusBadge status={recommendation.matchStatus} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Why CareBridge recommends this" icon="check" items={fitItems} />
        <Section
          title={showStillMissingLabel ? "Still missing" : "Information to confirm"}
          icon="question"
          items={recommendation.missingInformation}
        />
        <Section title="Documents to prepare" icon="source" items={recommendation.documentsToPrepare} />
        <Section title="Next step" icon="check" items={recommendation.nextSteps} />
      </div>

      {sources.length > 0 ? (
        <section className="mt-4 rounded-md border border-primary/20 bg-primary/5 px-3 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
            <FileText aria-hidden="true" className="size-4" />
            Source evidence
          </h3>
          <div className="mt-3 space-y-3">
            {sources.map((source) => (
              <div key={`${source.sourceId}-${source.title}`} className="text-sm leading-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="font-semibold text-foreground">{source.title}</p>
                  <Link
                    to={`/sources/${source.sourceId}`}
                    className="font-semibold text-primary underline-offset-4 hover:underline focus:outline-none focus:ring-4 focus:ring-primary/25"
                  >
                    View source
                  </Link>
                </div>
                {source.excerpt ? (
                  <p className="mt-1 text-muted-foreground">{source.excerpt}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : sourceCopy ? (
        <p className="mt-4 rounded-md border border-dashed border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          {sourceCopy}
        </p>
      ) : null}

      <div className="mt-5 flex justify-end">
        <Link
          to={`/resources/${recommendation.id}`}
          state={{ recommendation }}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-primary/30 bg-white px-3 py-2 text-sm font-semibold text-primary transition-colors duration-200 hover:border-primary hover:bg-primary/5 focus:outline-none focus:ring-4 focus:ring-primary/25"
        >
          View details
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
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
  const Icon = icon === "check" ? CheckCircle2 : icon === "question" ? HelpCircle : FileText;

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
