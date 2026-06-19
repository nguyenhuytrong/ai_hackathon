import { cn } from "@/lib/utils";
import type { MatchStatus } from "@/types/carebridge";

const labelByStatus: Record<MatchStatus, string> = {
  likely_match: "Likely Match",
  possible_match: "Possible Match",
  more_info_needed: "More Info Needed",
};

const classByStatus: Record<MatchStatus, string> = {
  likely_match: "border-emerald-200 bg-emerald-50 text-emerald-800",
  possible_match: "border-cyan-200 bg-cyan-50 text-cyan-800",
  more_info_needed: "border-amber-200 bg-amber-50 text-amber-800",
};

export function StatusBadge({ status }: { status: MatchStatus }) {
  return (
    <span className={cn("rounded-md border px-2.5 py-1 text-xs font-semibold", classByStatus[status])}>
      {labelByStatus[status]}
    </span>
  );
}
