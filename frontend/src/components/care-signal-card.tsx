import { CheckCircle2, CircleAlert } from "lucide-react";

export function CareSignalCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "attention" | "positive";
}) {
  const Icon = tone === "positive" ? CheckCircle2 : CircleAlert;
  const colorClass = tone === "positive" ? "text-emerald-700" : "text-amber-700";

  return (
    <article className="rounded-lg border border-border bg-white p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <Icon aria-hidden="true" className={`size-5 ${colorClass}`} />
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-semibold">{value}</p>
        </div>
      </div>
    </article>
  );
}
