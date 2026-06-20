import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const demoSession = {
  sessionId: "demo_123",
  profile: {
    caregiverName: "John",
    careRecipient: "Mother",
    dischargeTime: "less_than_7_days",
    mobility: "needs_some_assistance",
    transportation: "no_vehicle",
    insurance: "medicaid",
    caregiverWorking: true,
    caregiverBurden: "elevated",
    state: "OH",
    county: "Montgomery",
    biggestChallenge: "getting_to_appointments",
  },
  createdAt: "2026-06-19T10:00:00Z",
  updatedAt: "2026-06-19T10:00:00Z",
};

const recommendationRun = {
  runId: "rec_123",
  summary: "Based on your situation, CareBridge found three support areas worth exploring.",
  recommendations: [
    {
      id: "transportation_assistance",
      title: "Transportation Assistance",
      category: "transportation",
      matchStatus: "possible_match",
      matchedFactors: ["Transportation is a barrier to follow-up care."],
      missingInformation: ["Confirm whether the insurance plan covers non-emergency medical transportation."],
      whyThisMayFit: ["Transportation is a barrier to follow-up care."],
      documentsToPrepare: ["Insurance card", "Appointment date"],
      nextSteps: ["Ask the insurance provider or social worker about available transportation support."],
      sources: [
        {
          sourceId: "src_transport_guide",
          title: "Transportation Assistance Guide",
          sourceType: "webpage",
          url: "https://www.medicaid.gov/medicaid/benefits/non-emergency-medical-transportation/index.html",
          page: null,
          excerpt: "Transportation support may be available for covered medical appointments.",
        },
      ],
      evidenceStatus: "partial",
    },
  ],
  actionPlan: [
    {
      priority: 1,
      title: "Ask the insurance provider or social worker about available transportation support.",
      timeframe: "today",
      checklist: ["Insurance card", "Appointment date", "Write down questions before calling."],
    },
    {
      priority: 2,
      title: "Gather documents for transportation support.",
      timeframe: "this_week",
      checklist: ["Discharge paperwork", "Care recipient ID"],
    },
    {
      priority: 3,
      title: "Ask which transportation support works with therapy visits.",
      timeframe: "next_appointment",
      checklist: ["Bring appointment schedule", "Ask about ride timing"],
    },
  ],
  questionsToAsk: {
    doctor: ["What support should we prioritize after discharge?"],
    therapist: ["Is home-based therapy worth discussing?"],
    socialWorker: ["Are transportation or caregiver support programs available?"],
    insuranceProvider: ["Does this plan cover transportation or home-based support discussions?"],
  },
  disclaimer: "CareBridge does not determine final eligibility, provide medical advice, or replace healthcare professionals.",
};

const rehabRecommendationRun = {
  ...recommendationRun,
  recommendations: [
    {
      id: "rehab_services",
      title: "Rehabilitation Services",
      category: "rehab",
      matchStatus: "possible_match",
      matchedFactors: ["Mobility snapshot observed moderate mobility concern.", "Difficulty standing"],
      missingInformation: ["Confirm the mobility snapshot observations with the care team."],
      whyThisMayFit: ["Mobility snapshot observed moderate mobility concern.", "Difficulty standing"],
      documentsToPrepare: ["Discharge paperwork", "Therapy referral"],
      nextSteps: ["Call the clinic or discharge planner to confirm the first rehabilitation appointment."],
      sources: [],
      evidenceStatus: "insufficient",
    },
    ...recommendationRun.recommendations,
  ],
};

const rehabSnapshotResponse = {
  sessionId: "demo_123",
  rehabSnapshot: {
    mobilityConcern: "moderate",
    observations: ["Difficulty standing", "Reduced arm movement"],
    confidence: "medium",
    capturedAt: "2026-06-19T10:00:00Z",
  },
  suggestedRecompute: true,
};

const ragSearchResponse = {
  query: "transportation help for therapy appointments",
  results: [
    {
      chunkId: "chunk_src_transport_guide_1",
      score: 0.87,
      text: "Transportation support may be available for covered medical appointments.",
      source: {
        sourceId: "src_transport_guide",
        title: "Transportation Assistance Guide",
        url: "https://www.medicaid.gov/medicaid/benefits/non-emergency-medical-transportation/index.html",
        page: null,
        authorityLevel: "official_government",
      },
      metadata: {
        category: "transportation",
        state: "OH",
        county: "Montgomery",
      },
    },
  ],
};

const sourceDocument = {
  sourceId: "src_transport_guide",
  title: "Transportation Assistance Guide",
  url: "https://www.medicaid.gov/medicaid/benefits/non-emergency-medical-transportation/index.html",
  sourceType: "webpage",
  publisher: "Medicaid.gov",
  authorityLevel: "official_government",
  state: "OH",
  county: "Montgomery",
  category: "transportation",
  uploadedAt: "2026-06-19T10:00:00Z",
  verifiedAt: "2026-06-19T10:00:00Z",
  contentHash: "hash_123",
  chunks: [
    {
      chunkId: "chunk_src_transport_guide_1",
      sourceId: "src_transport_guide",
      resourceId: "transportation_assistance",
      text: "Transportation support may be available for covered medical appointments.",
      page: null,
      sectionTitle: "Transportation for covered medical care",
      metadata: { category: "transportation" },
    },
  ],
};

const resourceDetail = {
  id: "transportation_assistance",
  name: "Transportation Assistance",
  category: "transportation",
  description: "Support pathway for getting to follow-up visits and therapy appointments.",
  location: "Montgomery County, OH",
  sourceType: "local_program",
  officialUrl: null,
  eligibilityFactors: ["Transportation difficulty", "Medical appointment need"],
  documentsToPrepare: ["Insurance card", "Appointment date"],
  steps: ["Ask the insurance provider or social worker about available transportation support."],
  sources: [
    {
      sourceId: "src_transport_guide",
      title: "Transportation Assistance Guide",
      url: "https://www.medicaid.gov/medicaid/benefits/non-emergency-medical-transportation/index.html",
      sourceType: "webpage",
      page: null,
      authorityLevel: "official_government",
      excerpt: "Transportation support may be available for covered medical appointments.",
    },
  ],
};

function apiResponse(data: unknown, ok = true) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: () =>
      Promise.resolve(
        ok
          ? { success: true, message: "ok", data }
          : { success: false, message: "Backend unavailable", status: 500, errors: {} },
      ),
  } as Response);
}

function renderApp(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  );
}

describe("CareBridge Phase 1 product flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders product navigation and the support plan home screen", () => {
    renderApp();

    expect(screen.getByRole("link", { name: /^Home$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Intake$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Benefits$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Plan$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Rehab Snapshot$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Profile$/i })).toBeInTheDocument();
    expect(screen.getByText(/benefits and support navigator/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Your Support Navigation Plan/i })).toBeInTheDocument();
    expect(screen.getByText(/Transportation Assistance/i)).toBeInTheDocument();
  });

  it("makes the judge demo path obvious from home", () => {
    renderApp();

    expect(screen.getByRole("heading", { name: /3-minute demo path/i })).toBeInTheDocument();
    expect(screen.getByText(/Load demo persona/i)).toBeInTheDocument();
    expect(screen.getByText(/Review support matches with source evidence/i)).toBeInTheDocument();
    expect(screen.getByText(/Open the action plan checklist/i)).toBeInTheDocument();
    expect(screen.getByText(/Optionally update with Rehab Snapshot/i)).toBeInTheDocument();
  });

  it("loads the demo persona from the backend and carries it into profile and benefits", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => apiResponse(demoSession))
      .mockImplementationOnce(() => apiResponse(recommendationRun))
      .mockImplementationOnce(() => apiResponse(ragSearchResponse));
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: /Load Demo Persona/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/sessions/demo",
      expect.objectContaining({ method: "POST" }),
    ));

    fireEvent.click(screen.getByRole("link", { name: /^Profile$/i }));

    expect(await screen.findByText(/John/i)).toBeInTheDocument();
    expect(screen.getByText(/Montgomery County, OH/i)).toBeInTheDocument();
    expect(window.localStorage.getItem("carebridge.session")).toContain("demo_123");

    fireEvent.click(screen.getByRole("link", { name: /^Benefits$/i }));
    expect(await screen.findByText(/Possible Match/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirm whether the insurance plan covers/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/Transportation support may be available for covered medical appointments/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /View details/i })).toHaveAttribute(
      "href",
      "/resources/transportation_assistance",
    );
    expect(screen.getByRole("link", { name: /View source/i })).toHaveAttribute(
      "href",
      "/sources/src_transport_guide",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/sessions/demo_123/recommendations",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("\"includeRagEvidence\":true"),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/rag/search",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("saves completed intake through backend session endpoints", async () => {
    const createSession = {
      sessionId: "sess_123",
      profile: {},
      createdAt: "2026-06-19T10:00:00Z",
      updatedAt: "2026-06-19T10:00:00Z",
    };
    const updatedSession = {
      ...createSession,
      profile: {
        ...demoSession.profile,
        county: "Montgomery",
      },
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => apiResponse(createSession))
      .mockImplementationOnce(() => apiResponse(updatedSession));

    renderApp("/intake");

    fireEvent.click(screen.getByRole("button", { name: /Less than 7 days ago/i }));
    fireEvent.click(screen.getByRole("button", { name: /Needs some assistance/i }));
    fireEvent.click(screen.getByRole("button", { name: /^No vehicle$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Medicaid$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Elevated$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Getting to appointments/i }));

    expect(await screen.findByRole("heading", { name: /Intake profile saved/i })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/api/v1/sessions",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/v1/sessions/sess_123/intake",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining("\"transportation\":\"no_vehicle\""),
      }),
    );
  });

  it("restores the cached session profile from local storage", () => {
    window.localStorage.setItem(
      "carebridge.session",
      JSON.stringify({ sessionId: "demo_cached", profile: demoSession.profile }),
    );

    renderApp("/profile");

    expect(screen.getByText(/John/i)).toBeInTheDocument();
    expect(screen.getByText(/Montgomery County, OH/i)).toBeInTheDocument();
  });

  it("shows an error state when backend demo loading fails", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => apiResponse(null, false));
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: /Load Demo Persona/i }));

    expect(await screen.findByText(/Backend unavailable/i)).toBeInTheDocument();
  });

  it("routes rehab snapshot through the CareBridge shell and requires a session", () => {
    renderApp("/rehab-snapshot");

    expect(screen.getByText(/Mobility snapshot needs an intake profile/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Start Intake/i })).toHaveAttribute("href", "/intake");
    expect(screen.getByText(/does not provide medical advice/i)).toBeInTheDocument();
  });

  it("saves a demo rehab snapshot and refreshes support recommendations", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => apiResponse(rehabSnapshotResponse))
      .mockImplementationOnce(() => apiResponse(rehabRecommendationRun));
    window.localStorage.setItem(
      "carebridge.session",
      JSON.stringify({ sessionId: "demo_123", profile: demoSession.profile }),
    );

    renderApp("/rehab-snapshot");

    fireEvent.click(screen.getByRole("button", { name: /Use demo mobility snapshot/i }));
    expect(screen.getByRole("heading", { name: /Optional Mobility Snapshot/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Update Support Plan/i }));

    expect(await screen.findByText(/Care Plan Updated with Rehab Data/i)).toBeInTheDocument();
    expect(screen.getByText(/Rehab follow-up moved into the first support priority/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/api/v1/sessions/demo_123/rehab-snapshot",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("\"mobilityConcern\":\"moderate\""),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/v1/sessions/demo_123/recommendations",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows a non-blocking rehab snapshot fallback when camera access fails", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error("denied")),
      },
    });
    window.localStorage.setItem(
      "carebridge.session",
      JSON.stringify({ sessionId: "demo_123", profile: demoSession.profile }),
    );

    renderApp("/rehab-snapshot");

    fireEvent.click(screen.getByRole("button", { name: /Start camera assessment/i }));

    expect(await screen.findByText(/Camera assessment is unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Use demo mobility snapshot/i })).toBeInTheDocument();
  });

  it("renders the action plan from backend recommendation output", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => apiResponse(recommendationRun));
    window.localStorage.setItem(
      "carebridge.session",
      JSON.stringify({ sessionId: "demo_123", profile: demoSession.profile }),
    );

    renderApp("/plan");

    expect(await screen.findByText(/Ask the insurance provider or social worker/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Today$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^This Week$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^At Next Appointment$/i })).toBeInTheDocument();
    expect(screen.getByText(/Insurance card/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View resource details/i })).toHaveAttribute(
      "href",
      "/resources/transportation_assistance",
    );
    expect(screen.getByText(/Ask the social worker/i)).toBeInTheDocument();
  });

  it("renders resource detail with recommendation context and source evidence", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => apiResponse(recommendationRun))
      .mockImplementationOnce(() => apiResponse(ragSearchResponse))
      .mockImplementationOnce(() => apiResponse(resourceDetail));
    window.localStorage.setItem(
      "carebridge.session",
      JSON.stringify({ sessionId: "demo_123", profile: demoSession.profile }),
    );

    renderApp("/benefits");

    fireEvent.click(await screen.findByRole("link", { name: /View details/i }));

    expect(await screen.findByRole("heading", { name: /Transportation Assistance/i })).toBeInTheDocument();
    expect(screen.getByText(/Possible Match/i)).toBeInTheDocument();
    expect(screen.getByText(/Why this may fit/i)).toBeInTheDocument();
    expect(screen.getByText(/Transportation difficulty/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirm whether the insurance plan covers/i)).toBeInTheDocument();
    expect(screen.getByText(/Transportation support may be available/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open source detail/i })).toHaveAttribute(
      "href",
      "/sources/src_transport_guide",
    );
  });

  it("shows an error state when resource detail loading fails", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => apiResponse(null, false));

    renderApp("/resources/transportation_assistance");

    expect(await screen.findByText(/Backend unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to Benefits/i })).toHaveAttribute("href", "/benefits");
  });

  it("shows an error state when backend recommendation generation fails", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => apiResponse(null, false));
    window.localStorage.setItem(
      "carebridge.session",
      JSON.stringify({ sessionId: "demo_123", profile: demoSession.profile }),
    );

    renderApp("/benefits");

    expect(await screen.findByText(/Backend unavailable/i)).toBeInTheDocument();
  });

  it("renders backend evidence search results on benefits", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => apiResponse(recommendationRun))
      .mockImplementationOnce(() => apiResponse(ragSearchResponse));
    window.localStorage.setItem(
      "carebridge.session",
      JSON.stringify({ sessionId: "demo_123", profile: demoSession.profile }),
    );

    renderApp("/benefits");

    expect(await screen.findByRole("heading", { name: /Evidence Search/i })).toBeInTheDocument();
    expect(await screen.findByText(/Score 0.87/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Transportation Assistance Guide/i).length).toBeGreaterThan(0);
  });

  it("renders source viewer details from backend source API", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => apiResponse(sourceDocument));

    renderApp("/sources/src_transport_guide");

    expect(await screen.findByRole("heading", { name: /Transportation Assistance Guide/i })).toBeInTheDocument();
    expect(screen.getByText(/Medicaid.gov/i)).toBeInTheDocument();
    expect(screen.getByText(/Transportation for covered medical care/i)).toBeInTheDocument();
    expect(screen.getByText(/Transportation support may be available/i)).toBeInTheDocument();
  });

  it("shows an error state when source viewer loading fails", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => apiResponse(null, false));

    renderApp("/sources/src_transport_guide");

    expect(await screen.findByText(/Backend unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to Benefits/i })).toHaveAttribute("href", "/benefits");
  });

  it("offers demo recovery actions when the action plan has no profile", () => {
    renderApp("/plan");

    expect(screen.getByText(/Action plan needs an intake profile/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Start Intake/i })).toHaveAttribute("href", "/intake");
    expect(screen.getByRole("button", { name: /Load Demo Persona/i })).toBeInTheDocument();
  });

  it("shows one intake question at a time with a not sure option", () => {
    renderApp("/intake");

    expect(screen.getByRole("heading", { name: /Discharge context/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Not sure/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Transportation/i })).not.toBeInTheDocument();
  });

  it("keeps responsible AI visible and avoids certainty language", () => {
    renderApp("/benefits");

    expect(screen.getByText(/does not determine final eligibility/i)).toBeInTheDocument();
    expect(screen.getByText(/does not provide medical advice/i)).toBeInTheDocument();

    const pageText = document.body.textContent ?? "";
    expect(pageText).not.toMatch(/\byou qualify\b/i);
    expect(pageText).not.toMatch(/\beligible\b/i);
    expect(pageText).not.toMatch(/\bapproved\b/i);
    expect(pageText).not.toMatch(/\bguaranteed\b/i);
    expect(pageText).not.toMatch(/\bdiagnosed\b/i);
    expect(pageText).not.toMatch(/\btreatment required\b/i);
  });
});
