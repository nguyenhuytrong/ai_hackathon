import { CheckCircle2, FileText, HelpCircle } from "lucide-react";
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
  const sourceCopy =
    recommendation.sourcePlaceholder ??
    (recommendation.sources && recommendation.sources.length > 0
      ? "Source evidence is attached to this recommendation."
      : "Source evidence will be added in a later evidence phase.");

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

      <p className="mt-4 rounded-md border border-dashed border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
        {sourceCopy}
      </p>
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
