import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingState({ title = "Loading care context" }: { title?: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-6 shadow-soft">
      <Loader2 aria-hidden="true" className="mb-3 size-6 animate-spin text-primary" />
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">CareBridge is preparing the next view.</p>
    </div>
  );
}

export function ErrorState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-950 shadow-soft">
      <AlertCircle aria-hidden="true" className="mb-3 size-6" />
      <p className="font-semibold">{title}</p>
      <div className="mt-1 text-sm leading-6">{children}</div>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-white p-6 shadow-soft">
      <Inbox aria-hidden="true" className="mb-3 size-6 text-primary" />
      <p className="font-semibold">{title}</p>
      <div className="mt-1 text-sm leading-6 text-muted-foreground">{children}</div>
    </div>
  );
}
