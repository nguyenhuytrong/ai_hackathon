import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { demoProfile } from "@/data/mock-carebridge";
import type { IntakeProfile } from "@/types/carebridge";

const STORAGE_KEY = "carebridge.intakeProfile";

type CareBridgeContextValue = {
  profile: IntakeProfile | null;
  loadDemoProfile: () => void;
  updateProfile: (profile: IntakeProfile) => void;
  clearProfile: () => void;
};

const CareBridgeContext = createContext<CareBridgeContextValue | null>(null);

function readStoredProfile(): IntakeProfile | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as IntakeProfile) : null;
  } catch {
    return null;
  }
}

export function CareBridgeProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<IntakeProfile | null>(() => readStoredProfile());

  useEffect(() => {
    if (profile) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [profile]);

  const value = useMemo<CareBridgeContextValue>(
    () => ({
      profile,
      loadDemoProfile: () => setProfile(demoProfile),
      updateProfile: (nextProfile) => setProfile(nextProfile),
      clearProfile: () => setProfile(null),
    }),
    [profile],
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
