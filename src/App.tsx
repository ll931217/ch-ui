import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "@/components/common/Sidebar";
import HomePage from "@/pages/Home";
import MetricsPage from "@/pages/Metrics";
import SettingsPage from "@/pages/Settings";
import { ThemeProvider } from "@/components/common/theme-provider";
import { AppearanceProvider } from "@/contexts/AppearanceContext";
import AppInitializer from "@/components/common/AppInit";
import NotFound from "./pages/NotFound";
import Admin from "@/pages/Admin";
import LogsPage from "@/pages/Logs";
import { AdminRoute } from "@/features/admin/routes/adminRoute";

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AppearanceProvider>
        <Router basename={import.meta.env.BASE_URL}>
          <AppInitializer>
            <Routes>
              {/* Main app routes with sidebar */}
              <Route
                path="/"
                element={
                  <MainLayout>
                    <HomePage />
                  </MainLayout>
                }
              />
              <Route
                path="/metrics"
                element={
                  <MainLayout>
                    <MetricsPage />
                  </MainLayout>
                }
              />
              <Route
                path="/logs"
                element={
                  <MainLayout>
                    <LogsPage />
                  </MainLayout>
                }
              />
              <Route
                path="/admin"
                element={
                  <MainLayout>
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  </MainLayout>
                }
              />
              <Route
                path="/settings"
                element={
                  <MainLayout>
                    <SettingsPage />
                  </MainLayout>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppInitializer>
        </Router>
      </AppearanceProvider>
    </ThemeProvider>
  );
}
