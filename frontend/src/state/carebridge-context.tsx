import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createDemoSession, createSession, generateRecommendations, updateIntakeProfile } from "@/api/client";
import type { IntakeProfile, RecommendationRun, Session } from "@/types/carebridge";

const STORAGE_KEY = "carebridge.session";

type StoredSession = {
  sessionId: string | null;
  profile: IntakeProfile | null;
};

type CareBridgeContextValue = {
  sessionId: string | null;
  profile: IntakeProfile | null;
  recommendationRun: RecommendationRun | null;
  isSaving: boolean;
  isLoadingRecommendations: boolean;
  error: string | null;
  recommendationError: string | null;
  loadDemoProfile: () => Promise<void>;
  saveIntakeProfile: (profile: IntakeProfile) => Promise<void>;
  loadRecommendations: () => Promise<void>;
  clearProfile: () => void;
};

const CareBridgeContext = createContext<CareBridgeContextValue | null>(null);

function readStoredSession(): StoredSession {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as StoredSession) : { sessionId: null, profile: null };
  } catch {
    return { sessionId: null, profile: null };
  }
}

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : "CareBridge could not save the session.";
}

export function CareBridgeProvider({ children }: { children: ReactNode }) {
  const storedSession = readStoredSession();
  const [sessionId, setSessionId] = useState<string | null>(storedSession.sessionId);
  const [profile, setProfile] = useState<IntakeProfile | null>(storedSession.profile);
  const [recommendationRun, setRecommendationRun] = useState<RecommendationRun | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId || profile) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, profile }));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [profile, sessionId]);

  const loadDemoProfile = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    setRecommendationRun(null);
    setRecommendationError(null);
    try {
      const session = await createDemoSession();
      applySession(session);
    } catch (nextError) {
      setError(messageFromError(nextError));
    } finally {
      setIsSaving(false);
    }
  }, []);

  const saveIntakeProfile = useCallback(async (nextProfile: IntakeProfile) => {
    setIsSaving(true);
    setError(null);
    setRecommendationRun(null);
    setRecommendationError(null);
    try {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const session = await createSession({ demoMode: false });
        activeSessionId = session.sessionId;
        setSessionId(session.sessionId);
      }

      const updatedSession = await updateIntakeProfile(activeSessionId, nextProfile);
      applySession(updatedSession);
    } catch (nextError) {
      setError(messageFromError(nextError));
      throw nextError;
    } finally {
      setIsSaving(false);
    }
  }, [sessionId]);

  const loadRecommendations = useCallback(async () => {
    if (!sessionId) {
      setRecommendationError("Complete intake or load the demo persona before generating support matches.");
      return;
    }

    setIsLoadingRecommendations(true);
    setRecommendationError(null);
    try {
      const run = await generateRecommendations(sessionId);
      setRecommendationRun(run);
    } catch (nextError) {
      setRecommendationError(messageFromError(nextError));
      throw nextError;
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [sessionId]);

  function applySession(session: Session) {
    setSessionId(session.sessionId);
    setProfile(session.profile);
    setRecommendationRun(null);
    setRecommendationError(null);
  }

  const value = useMemo<CareBridgeContextValue>(
    () => ({
      sessionId,
      profile,
      recommendationRun,
      isSaving,
      isLoadingRecommendations,
      error,
      recommendationError,
      loadDemoProfile,
      saveIntakeProfile,
      loadRecommendations,
      clearProfile: () => {
        setSessionId(null);
        setProfile(null);
        setRecommendationRun(null);
        setError(null);
        setRecommendationError(null);
      },
    }),
    [
      error,
      isLoadingRecommendations,
      isSaving,
      loadDemoProfile,
      loadRecommendations,
      profile,
      recommendationError,
      recommendationRun,
      saveIntakeProfile,
      sessionId,
    ],
  );

  return <CareBridgeContext.Provider value={value}>{children}</CareBridgeContext.Provider>;
}

export function useCareBridge() {
  const context = useContext(CareBridgeContext);
  if (!context) {
    throw new Error("useCareBridge must be used within CareBridgeProvider");
  }
  return context;
}
