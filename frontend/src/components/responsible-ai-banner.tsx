import { ShieldCheck } from "lucide-react";

export function ResponsibleAiBanner() {
  return (
    <section className="rounded-lg border border-border bg-white p-5 shadow-soft">
      <div className="flex gap-4">
        <ShieldCheck aria-hidden="true" className="mt-1 size-6 shrink-0 text-primary" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-normal">Responsible AI boundary</h2>
          <p className="leading-7 text-muted-foreground">
            CareBridge does not determine final eligibility, does not provide medical advice, and
            does not replace healthcare professionals or program administrators.
          </p>
        </div>
      </div>
    </section>
  );
}
