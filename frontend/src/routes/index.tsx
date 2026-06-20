import { Route, Routes } from "react-router-dom";
import { BenefitsPage } from "@/pages/benefits-page";
import { RehabSnapshotPage } from "@/pages/rehab-snapshot-page";
import { HomePage } from "@/pages/home-page";
import { IntakePage } from "@/pages/intake-page";
import { PlanPage } from "@/pages/plan-page";
import { ProfilePage } from "@/pages/profile-page";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/rehab_snapshot" element={<RehabSnapshotPage />} />
      <Route path="/intake" element={<IntakePage />} />
      <Route path="/benefits" element={<BenefitsPage />} />
      <Route path="/plan" element={<PlanPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}
