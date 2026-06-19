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

export type SupportRecommendation = {
  id: string;
  title: string;
  category: string;
  matchStatus: MatchStatus;
  matchedFactors: string[];
  missingInformation: string[];
  documentsToPrepare: string[];
  nextSteps: string[];
  sourcePlaceholder: string;
};

export type ActionPlanItem = {
  group: "Today" | "This Week" | "At Next Appointment";
  title: string;
  why: string;
  checklist: string[];
  contact: string;
};

export type QuestionGroups = {
  doctor: string[];
  therapist: string[];
  socialWorker: string[];
  insuranceProvider: string[];
};
