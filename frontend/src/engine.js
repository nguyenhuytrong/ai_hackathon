// ===============================
// CLINICAL MOVEMENT SCORE ENGINE
// ===============================

// ---------- SOURCES ----------
export const SOURCES = {
  arm: [
    {
      title: "AAOS Shoulder Range of Motion",
      url: "https://orthoinfo.aaos.org/"
    },
    {
      title: "Measurement of Joint Motion (Norkin & White)",
      url: "https://example.com/norkin-white"
    }
  ],
  sts: [
    {
      title: "Five Times Sit-to-Stand Test (5xSTS)",
      url: "https://pmc.ncbi.nlm.nih.gov/"
    },
    {
      title: "Bohannon RW 2006 - Sit to Stand Norms",
      url: "https://pubmed.ncbi.nlm.nih.gov/"
    }
  ],
  balance: [
    {
      title: "Postural Sway & Balance Control",
      url: "https://pubmed.ncbi.nlm.nih.gov/"
    }
  ]
};

// ---------- BASELINE DEFAULTS ----------
const BASELINE = {
  arm: { mean: 10, std: 8 },
  sts: { mean: 2.5, std: 1.2 },
  balance: { std: 0.02 }
};

// ---------- METRICS ----------
export function armMetric(left, right) {
  const asymmetry = Math.abs(left - right);
  return asymmetry / BASELINE.arm.std;
}

export function stsMetric(avgTime) {
  return (avgTime - BASELINE.sts.mean) / BASELINE.sts.std;
}

export function balanceMetric(sway) {
  return sway / BASELINE.balance.std;
}

// ---------- CMS ENGINE ----------
export function computeCMS(data) {
  const arm = armMetric(data.leftROM, data.rightROM);
  const sts = stsMetric(data.avgTimeSec);
  const bal = balanceMetric(data.sway);

  const CMS =
    0.35 * arm +
    0.35 * sts +
    0.30 * bal;

  return {
    CMS,
    severity: getSeverity(CMS),
    breakdown: {
      arm,
      sts,
      balance: bal
    }
  };
}

// ---------- SEVERITY ----------
export function getSeverity(cms) {
  if (cms < 0.5) return "normal";
  if (cms < 1.5) return "mild impairment";
  if (cms < 2.5) return "moderate impairment";
  return "severe impairment";
}

// ---------- SOURCE HELP ----------
export function getSources() {
  return SOURCES;
}