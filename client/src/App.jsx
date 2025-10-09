
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { ReportProvider } from './contexts/ReportContext';
import { Header } from './components/Header';
import { ServiceRequestNotification } from './components/ServiceRequestNotification';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthorityRoute } from './components/AuthorityRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MapPage } from './pages/MapPage';
import { ReportPage } from './pages/ReportPage';
import { DashboardPage } from './pages/DashboardPage';

import { AnalyticsPage } from './pages/AnalyticsPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { CookiePolicyPage } from './pages/CookiePolicyPage';
import { DisclaimerPage } from './pages/DisclaimerPage';
import { HelperPage } from './pages/HelperPage';
import { ServiceProviderPage } from './pages/ServiceProviderPage';
import { ProfilePage } from './pages/ProfilePage';
import { PathScanPage } from './pages/PathScanPage';
import { SearchPage } from './pages/SearchPage';
import { MyReportsPage } from './pages/MyReportPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
 

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ReportProvider>
          <Router>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/cookies" element={<CookiePolicyPage />} />
              <Route path="/disclaimer" element={<DisclaimerPage />} />
              <Route path="/*" element={
                <>
                  <Header />
                  <main className="w-full">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/map" element={<MapPage />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/leaderboard" element={<LeaderboardPage />} />
                      <Route path="/report" element={
                        <ProtectedRoute>
                          <ReportPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/my-reports" element={
                        <ProtectedRoute>
                          <MyReportsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/helper" element={
                        <ProtectedRoute>
                          <HelperPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/profile" element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      } />

                      <Route path="/path-scan" element={
                        <ProtectedRoute>
                          <PathScanPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/dashboard" element={
                        <AuthorityRoute>
                          <DashboardPage />
                        </AuthorityRoute>
                      } />
                      <Route path="/analytics" element={
                        <AuthorityRoute>
                          <AnalyticsPage />
                        </AuthorityRoute>
                      } />
                      <Route path="/service-provider" element={
                        <ProtectedRoute>
                          <ServiceProviderPage />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                  <ServiceRequestNotification />
                </>
              } />
            </Routes>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 2000,
                style: {
                  background: '#1e293b',
                  color: '#f8fafc',
                  borderRadius: '12px',
                  fontSize: '14px',
                  maxWidth: '400px',
                },
                success: {
                  style: {
                    background: '#059669',
                  },
                },
                error: {
                  style: {
                    background: '#dc2626',
                  },
                },
              }}
            />
          </div>
        </Router>
        </ReportProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;