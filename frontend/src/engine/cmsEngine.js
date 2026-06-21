export function computeCMS({ sit, arm, balance }) {
  const armScore = Math.abs(arm.peakLeft - arm.peakRight);
  const stsScore = sit.avgTimeSec;
  const balanceScore = balance.swayMagnitude;

  const CMS =
    0.35 * armScore +
    0.35 * stsScore +
    0.30 * balanceScore;

  return {
    CMS,
    severity: getSeverity(CMS),
    breakdown: {
      arm: armScore,
      sit: stsScore,
      balance: balanceScore,
    },
  };
}

function getSeverity(cms) {
  if (cms < 0.5) return "normal";
  if (cms < 1.5) return "mild impairment";
  if (cms < 2.5) return "moderate impairment";
  return "severe impairment";
}

export function getSources() {
  return {
    arm: [{ title: "AAOS Shoulder ROM", url: "https://orthoinfo.aaos.org/" }],
    sit: [{ title: "5xSTS Norms", url: "https://pubmed.ncbi.nlm.nih.gov/" }],
    balance: [{ title: "Postural Sway Studies", url: "https://pubmed.ncbi.nlm.nih.gov/" }],
  };
}