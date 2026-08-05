import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/AppShell";
import { LocationRestrictedScreen } from "@/components/LocationRestrictedScreen";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import DashboardPage from "@/pages/DashboardPage";
import EmployeeDetailPage from "@/pages/EmployeeDetailPage";
import EmployeesPage from "@/pages/EmployeesPage";
import LeavesPage from "@/pages/LeavesPage";
import LoginPage from "@/pages/LoginPage";
import MessagesPage from "@/pages/MessagesPage";
import PayrollPage from "@/pages/PayrollPage";
import ScreenshotsPage from "@/pages/ScreenshotsPage";

function AppContent() {
  const {
    locationRestricted,
    locationRestrictedMessage,
    isRetryingLocation,
    dismissLocationRestriction,
    retryLocationCheck,
  } = useAuth();

  // Takes over the entire app regardless of route — not just a blocked
  // action or page, per the requirement that out-of-range users can't
  // reach anything.
  if (locationRestricted) {
    return (
      <LocationRestrictedScreen
        message={locationRestrictedMessage}
        onDismiss={dismissLocationRestriction}
        onRetry={retryLocationCheck}
        isRetrying={isRetryingLocation}
      />
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/employees/:id" element={<EmployeeDetailPage />} />
        <Route path="/leaves" element={<LeavesPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/screenshots" element={<ScreenshotsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}
