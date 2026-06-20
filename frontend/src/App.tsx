import { AppLayout } from "./components/app-layout";
import { CareBridgeProvider } from "./state/carebridge-context";
import { AppRoutes } from "./routes";

export default function App() {
  return (
    <CareBridgeProvider>
      <AppLayout>
        <AppRoutes />
      </AppLayout>
    </CareBridgeProvider>
  );
}
