import type {
  ApiResponse,
  CreateSessionRequest,
  GenerateRecommendationsRequest,
  RecommendationRun,
  RagSearchRequest,
  RagSearchResponse,
  Session,
  RehabSnapshotReport,
  RehabSnapshotReportRequest,
  UpdateIntakeRequest,
} from "@/types/carebridge";

const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

export async function getHealth() {
  const response = await fetch(`${apiBaseUrl}/health`);

  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}`);
  }

  return response.json();
}

async function requestApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(
      payload.message || `Request failed with status ${response.status}`,
    );
  }

  return payload.data;
}

export function createSession(
  request: CreateSessionRequest = { demoMode: false },
) {
  return requestApi<Session>("/sessions", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function createDemoSession() {
  return requestApi<Session>("/sessions/demo", {
    method: "POST",
  });
}

export function updateIntakeProfile(
  sessionId: string,
  profile: UpdateIntakeRequest,
) {
  return requestApi<Session>(`/sessions/${sessionId}/intake`, {
    method: "PATCH",
    body: JSON.stringify(profile),
  });
}

export function generateRecommendations(
  sessionId: string,
  request: GenerateRecommendationsRequest = {
    includeRagEvidence: true,
    regenerate: true,
  },
) {
  return requestApi<RecommendationRun>(
    `/sessions/${sessionId}/recommendations`,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}

export function getLatestRecommendations(sessionId: string) {
  return requestApi<RecommendationRun>(
    `/sessions/${sessionId}/recommendations/latest`,
  );
}

export function searchRag(request: RagSearchRequest) {
  return requestApi<RagSearchResponse>("/rag/search", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function ingestRagSources(dryRun = false) {
  return requestApi(`/rag/ingest?dryRun=${dryRun ? "true" : "false"}`, {
    method: "POST",
  });
}

export function generateRehabSnapshotReport(
  request: RehabSnapshotReportRequest,
) {
  return requestApi<RehabSnapshotReport>("/rehab-snapshot/report", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
