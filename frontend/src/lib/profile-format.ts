import type { IntakeProfile } from "@/types/carebridge";

export function formatCounty(profile: IntakeProfile | null | undefined) {
  if (!profile?.county) {
    return "Montgomery County, OH";
  }

  if (profile.county === "Montgomery" && profile.state === "OH") {
    return "Montgomery County, OH";
  }

  return profile.county;
}

export function formatProfileValue(key: string, value: unknown, profile: IntakeProfile) {
  if (key === "county") {
    return formatCounty(profile);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value).replaceAll("_", " ");
}
