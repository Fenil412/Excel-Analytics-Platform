import { Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ExcelProvider } from "./contexts/ExcelContext";
import { ChartProvider } from "./contexts/ChartContext";

// Pages
import HomePage from "./pages/HomePage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import NotFoundPage from "./pages/NotFoundPage";
import Layout from "./Layout.jsx";

// Protected
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminPage from "./pages/AdminPage";

// Dashboard layout pages
import Dashboard from "./pages/Dashboard/Dashboard";
import FileUpload from "./pages/Upload/FileUpload";
import Analytics from "./pages/Analytics/Analytics";
import Settings from "./pages/Settings/Settings";

function App() {
  const location = useLocation();

  return (
    <ThemeProvider>
      <ExcelProvider>
        <ChartProvider>
          <Routes location={location}>
            <Route path="/" element={<Layout />}>
              <Route path="" element={<HomePage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/verify-otp" element={<VerifyOtpPage />} />

              {/* Protected Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <FileUpload />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Admin Route */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ChartProvider>
      </ExcelProvider>
    </ThemeProvider>
  );
}

export default App;
