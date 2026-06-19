import type { ActionPlanItem, IntakeProfile, QuestionGroups, SupportRecommendation } from "@/types/carebridge";

export const demoProfile: IntakeProfile = {
  caregiverName: "John",
  careRecipient: "Mother",
  dischargeTime: "less_than_7_days",
  mobility: "needs_some_assistance",
  transportation: "no_vehicle",
  insurance: "medicaid",
  caregiverWorking: true,
  caregiverBurden: "elevated",
  state: "OH",
  county: "Montgomery County, OH",
  biggestChallenge: "getting_to_appointments",
};

export const mockRecommendations: SupportRecommendation[] = [
  {
    id: "rehab-services",
    title: "Rehabilitation Services",
    category: "rehab",
    matchStatus: "likely_match",
    matchedFactors: [
      "Recent discharge may require follow-up therapy planning.",
      "Mobility support was reported as a current need.",
    ],
    missingInformation: ["Confirm whether outpatient or home-based therapy has already been scheduled."],
    documentsToPrepare: ["Discharge summary", "Therapy referral", "Insurance card"],
    nextSteps: ["Call the discharge planner or clinic to confirm the first rehab appointment."],
    sourcePlaceholder: "Source evidence will appear after the RAG phase.",
  },
  {
    id: "transportation-assistance",
    title: "Transportation Assistance",
    category: "transportation",
    matchStatus: "possible_match",
    matchedFactors: [
      "You reported no reliable vehicle for appointments.",
      "Follow-up visits may require dependable transportation.",
    ],
    missingInformation: ["Confirm whether the insurance plan covers non-emergency medical transportation."],
    documentsToPrepare: ["Insurance card", "Appointment date", "Clinic address", "Discharge summary"],
    nextSteps: ["Ask the insurance provider or social worker about transportation support."],
    sourcePlaceholder: "Citation placeholder for transportation guidance.",
  },
  {
    id: "caregiver-support",
    title: "Caregiver Support Programs",
    category: "caregiver_support",
    matchStatus: "more_info_needed",
    matchedFactors: [
      "The caregiver is balancing work responsibilities.",
      "Caregiver burden was marked as elevated.",
    ],
    missingInformation: ["Confirm available respite, local nonprofit, or county caregiver support options."],
    documentsToPrepare: ["Caregiver contact information", "Care recipient discharge paperwork"],
    nextSteps: ["Ask the social worker which caregiver support programs are worth discussing."],
    sourcePlaceholder: "Community support sources will be attached in a later phase.",
  },
];

export const actionPlanItems: ActionPlanItem[] = [
  {
    group: "Today",
    title: "Confirm rehabilitation follow-up",
    why: "No rehab appointment has been confirmed after recent discharge.",
    checklist: [
      "Call the clinic or discharge planner.",
      "Confirm whether the referral was received.",
      "Prepare insurance information.",
      "Ask whether home-based therapy is worth discussing.",
    ],
    contact: "Clinic or discharge planner",
  },
  {
    group: "This Week",
    title: "Ask about transportation support",
    why: "Transportation is currently a barrier to follow-up appointments.",
    checklist: [
      "Write down appointment locations.",
      "Call the insurance provider.",
      "Ask the social worker about local ride programs.",
    ],
    contact: "Insurance provider or social worker",
  },
  {
    group: "At Next Appointment",
    title: "Bring support questions to the care team",
    why: "CareBridge can help organize questions before the visit.",
    checklist: [
      "Bring discharge paperwork.",
      "Ask what signs should prompt a call.",
      "Ask what therapy schedule is expected.",
    ],
    contact: "Doctor or therapist",
  },
];

export const questionGroups: QuestionGroups = {
  doctor: ["What changes should we watch for after discharge?", "Who should we call if symptoms change?"],
  therapist: ["Is home-based therapy worth discussing?", "Does the patient need mobility equipment?"],
  socialWorker: ["Are transportation services available?", "What documents should we prepare?"],
  insuranceProvider: ["Is transportation to rehab covered?", "Does home health require prior authorization?"],
};

export const careSignals = [
  { label: "Mobility", value: "Moderate concern", tone: "attention" },
  { label: "Transportation", value: "Needs support", tone: "attention" },
  { label: "Caregiver Burden", value: "Elevated", tone: "attention" },
  { label: "Family Support", value: "Available", tone: "positive" },
] as const;
