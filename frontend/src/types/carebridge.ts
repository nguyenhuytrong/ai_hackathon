export type MatchStatus =
  | "likely_match"
  | "possible_match"
  | "more_info_needed";

export type IntakeProfile = {
  caregiverName?: string;
  careRecipient?: string;
  dischargeTime?: string;
  mobility?: string;
  transportation?: string;
  insurance?: string;
  caregiverWorking?: boolean;
  caregiverBurden?: string;
  state?: string;
  county?: string;
  biggestChallenge?: string;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type Session = {
  sessionId: string;
  profile: IntakeProfile;
  createdAt: string;
  updatedAt?: string;
};

export type CreateSessionRequest = {
  demoMode?: boolean;
};

export type UpdateIntakeRequest = IntakeProfile;

export type GenerateRecommendationsRequest = {
  includeRagEvidence?: boolean;
  useLlmExplanation?: boolean;
  regenerate?: boolean;
};

export type SourceCitation = {
  sourceId: string;
  title: string;
  sourceType: string;
  url?: string | null;
  page?: number | null;
  excerpt?: string | null;
};

export type SupportRecommendation = {
  id: string;
  title: string;
  category: string;
  matchStatus: MatchStatus;
  matchedFactors: string[];
  missingInformation: string[];
  whyThisMayFit?: string[];
  evidenceSummary?: string[];
  documentsToPrepare: string[];
  nextSteps: string[];
  questionsToAsk?: string[];
  sourcePlaceholder?: string;
  sources?: SourceCitation[];
  evidenceStatus?: "insufficient" | "grounded";
};

export type ActionPlanItem = {
  group: "Today" | "This Week" | "At Next Appointment";
  title: string;
  why: string;
  checklist: string[];
  contact: string;
};

export type RecommendationActionPlanItem = {
  priority: number;
  title: string;
  timeframe: "today" | "this_week" | "next_appointment";
  checklist: string[];
};

export type QuestionGroups = {
  doctor: string[];
  therapist: string[];
  socialWorker: string[];
  insuranceProvider: string[];
};

export type RecommendationRun = {
  runId: string;
  summary: string;
  recommendations: SupportRecommendation[];
  actionPlan: RecommendationActionPlanItem[];
  questionsToAsk: QuestionGroups;
  disclaimer: string;
};

export type RagSearchRequest = {
  query: string;
  resourceId?: string;
  category?: string;
  state?: string;
  county?: string;
  topK?: number;
};

export type RagSearchResult = {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  publisher?: string | null;
  url?: string | null;
  authorityLevel: string;
  resourceId?: string | null;
  category: string;
  state?: string | null;
  county?: string | null;
  sectionTitle?: string | null;
  page?: number | null;
  score: number;
  text: string;
};

export type RagSearchResponse = {
  query: string;
  filters: Record<string, unknown>;
  results: RagSearchResult[];
};

export type RehabTaskMetrics = {
  sit?: {
    reps: number;
    avgTimeSec: number | null;
  };
  arm?: {
    peakLeft: number;
    peakRight: number;
    asymmetryDeg: number;
    weakSide: "left" | "right";
  };
  balance?: {
    swayMagnitude: number;
    durationSec: number;
  };
};

export type RehabSnapshotReportRequest = {
  cms?: {
    CMS: number;
    severity: string;
    breakdown?: {
      arm?: number;
      sit?: number;
      balance?: number;
    };
  };
  raw?: RehabTaskMetrics;
};

export type RehabSnapshotReport = {
  caregiverSummary: string;
  clinicalFlags: string[];
  nextSteps: string[];
};
