import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSource } from "@/api/client";
import { EmptyState, ErrorState, LoadingState } from "@/components/route-states";
import type { SourceDocument } from "@/types/carebridge";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export function SourceViewerPage() {
  const { sourceId } = useParams();
  const [source, setSource] = useState<SourceDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceId) {
      setIsLoading(false);
      setError("A source id is required.");
      return;
    }

    setIsLoading(true);
    setError(null);
    void getSource(sourceId)
      .then((response) => {
        setSource(response);
      })
      .catch((nextError: unknown) => {
        setError(nextError instanceof Error ? nextError.message : "CareBridge could not load this source.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [sourceId]);

  if (isLoading) {
    return <LoadingState title="Loading source evidence" />;
  }

  if (error) {
    return (
      <ErrorState title="Source request failed">
        <p>{error}</p>
      </ErrorState>
    );
  }

  if (!source) {
    return (
      <EmptyState title="Source not found">
        <p>CareBridge could not find stored source metadata for this citation.</p>
      </EmptyState>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-border bg-white p-6 shadow-soft">
        <Link
          to="/benefits"
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus:outline-none focus:ring-4 focus:ring-primary/25"
        >
          Back to benefits
        </Link>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Source Evidence
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">{source.title}</h1>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Meta label="Publisher" value={source.publisher ?? "Unknown"} />
          <Meta label="Authority" value={source.authorityLevel} />
          <Meta label="Category" value={source.category.replace("_", " ")} />
          <Meta label="Uploaded" value={formatDate(source.uploadedAt)} />
        </dl>
        {source.url ? (
          <a
            href={source.url}
            className="mt-4 inline-flex font-semibold text-primary underline-offset-4 hover:underline focus:outline-none focus:ring-4 focus:ring-primary/25"
            target="_blank"
            rel="noreferrer"
          >
            Open original source
          </a>
        ) : null}
      </div>

      {source.chunks.length === 0 ? (
        <EmptyState title="No stored chunks">
          <p>This source has metadata, but no searchable chunks are stored yet.</p>
        </EmptyState>
      ) : (
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-normal">Stored Chunks</h2>
          {source.chunks.map((chunk) => (
            <article key={chunk.chunkId} className="rounded-lg border border-border bg-white p-5 shadow-soft">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">
                  {chunk.sectionTitle ?? "Source excerpt"}
                </p>
                {chunk.page ? <p>Page {chunk.page}</p> : null}
                {chunk.resourceId ? <p>Resource {chunk.resourceId}</p> : null}
              </div>
              <p className="leading-7 text-muted-foreground">{chunk.text}</p>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
