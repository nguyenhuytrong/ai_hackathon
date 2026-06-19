import { Route, Routes } from "react-router-dom";

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <p className="border-t border-border pt-5 text-sm text-muted-foreground">
            Phase 1 will add guided intake, benefits, plan, and profile routes.
          </p>
        }
      />
    </Routes>
  );
}
