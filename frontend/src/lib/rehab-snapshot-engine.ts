import type { RehabTaskMetrics } from "@/types/carebridge";

export type RehabSource = {
  title: string;
  url: string;
};

export type ClinicalMovementScore = {
  score: number;
  concern: "low" | "moderate" | "high";
  summary: string;
  breakdown: {
    arm: number;
    sitToStand: number;
    balance: number;
  };
};

const sources: Record<"arm" | "sitToStand" | "balance", RehabSource[]> = {
  arm: [
    { title: "AAOS Shoulder Range of Motion", url: "https://orthoinfo.aaos.org/" },
    { title: "Measurement of Joint Motion", url: "https://www.fadavis.com/" },
  ],
  sitToStand: [
    { title: "Five Times Sit-to-Stand Test", url: "https://pmc.ncbi.nlm.nih.gov/" },
    { title: "Sit-to-Stand Norms", url: "https://pubmed.ncbi.nlm.nih.gov/" },
  ],
  balance: [
    { title: "Postural Sway and Balance Control", url: "https://pubmed.ncbi.nlm.nih.gov/" },
  ],
};

export function computeClinicalMovementScore(metrics: RehabTaskMetrics): ClinicalMovementScore {
  const armScore = metrics.arm ? Math.min(metrics.arm.asymmetryDeg / 8, 4) : 0;
  const sitScore = metrics.sit?.avgTimeSec ? Math.min(Math.max(metrics.sit.avgTimeSec - 2.5, 0) / 1.2, 4) : 0;
  const balanceScore = metrics.balance ? Math.min(metrics.balance.swayMagnitude / 0.02, 4) : 0;
  const score = 0.35 * armScore + 0.35 * sitScore + 0.3 * balanceScore;

  return {
    score,
    concern: getConcern(score),
    summary: getSummary(score),
    breakdown: {
      arm: armScore,
      sitToStand: sitScore,
      balance: balanceScore,
    },
  };
}

export function getRehabSources() {
  return sources;
}

function getConcern(score: number): ClinicalMovementScore["concern"] {
  if (score < 1.5) {
    return "low";
  }
  if (score < 2.5) {
    return "moderate";
  }
  return "high";
}

function getSummary(score: number) {
  if (score < 1.5) {
    return "Mobility observations look stable in this demo snapshot.";
  }
  if (score < 2.5) {
    return "Mobility observations may make rehab follow-up worth prioritizing.";
  }
  return "Mobility observations may make rehab and home-based support worth discussing with the care team.";
}
