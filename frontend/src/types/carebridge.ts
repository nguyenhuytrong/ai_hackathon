export type MatchStatus = "likely_match" | "possible_match" | "more_info_needed";

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
  regenerate?: boolean;
};

export type EvidenceStatus = "insufficient" | "partial" | "sufficient";

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
  documentsToPrepare: string[];
  nextSteps: string[];
  sourcePlaceholder?: string;
  sources?: SourceCitation[];
  evidenceStatus?: EvidenceStatus;
};

export type ResourceSourceCitation = {
  sourceId: string;
  title: string;
  url?: string | null;
  sourceType: string;
  page?: number | null;
  authorityLevel: string;
  excerpt?: string | null;
};

export type ResourceDetail = {
  id: string;
  name: string;
  category: string;
  description: string;
  location?: string | null;
  sourceType: string;
  officialUrl?: string | null;
  eligibilityFactors: string[];
  documentsToPrepare: string[];
  steps: string[];
  sources: ResourceSourceCitation[];
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

export type RagSearchFilters = {
  category?: string;
  state?: string;
  county?: string;
  resourceId?: string;
  sourceId?: string;
};

export type RagSearchRequest = {
  query: string;
  filters?: RagSearchFilters;
  topK?: number;
};

export type RagSearchResult = {
  chunkId: string;
  score: number;
  text: string;
  source: {
    sourceId: string;
    title: string;
    url?: string | null;
    page?: number | null;
    authorityLevel: string;
  };
  metadata: Record<string, unknown>;
};

export type RagSearchResponse = {
  query: string;
  results: RagSearchResult[];
};

export type DocumentChunk = {
  chunkId: string;
  sourceId: string;
  resourceId?: string | null;
  text: string;
  page?: number | null;
  sectionTitle?: string | null;
  metadata: Record<string, unknown>;
};

export type SourceDocument = {
  sourceId: string;
  title: string;
  url?: string | null;
  sourceType: string;
  publisher?: string | null;
  authorityLevel: string;
  state?: string | null;
  county?: string | null;
  category: string;
  uploadedAt: string;
  verifiedAt?: string | null;
  contentHash: string;
  chunks: DocumentChunk[];
};
