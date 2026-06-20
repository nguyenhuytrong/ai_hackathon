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
  includeRagEvidence?: false;
  regenerate?: boolean;
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
  sources?: unknown[];
  evidenceStatus?: "insufficient";
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
