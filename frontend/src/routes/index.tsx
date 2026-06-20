import { Route, Routes } from "react-router-dom";
import { BenefitsPage } from "@/pages/benefits-page";
import { HomePage } from "@/pages/home-page";
import { IntakePage } from "@/pages/intake-page";
import { PlanPage } from "@/pages/plan-page";
import { ProfilePage } from "@/pages/profile-page";
import { ResourceDetailPage } from "@/pages/resource-detail-page";
import { SourceViewerPage } from "@/pages/source-viewer-page";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/intake" element={<IntakePage />} />
      <Route path="/benefits" element={<BenefitsPage />} />
      <Route path="/plan" element={<PlanPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/resources/:resourceId" element={<ResourceDetailPage />} />
      <Route path="/sources/:sourceId" element={<SourceViewerPage />} />
    </Routes>
  );
}
