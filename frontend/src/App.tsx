import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardOverview } from './pages/DashboardOverview';
import { AICompanionPage } from './pages/AICompanionPage';
import { FacialAnalysisPage } from './pages/FacialAnalysisPage';
import { JournalPage } from './pages/JournalPage';
import { PersonalityPage } from './pages/PersonalityPage';
import { StressDistressPage } from './pages/StressDistressPage';
import { WearablesPage } from './pages/WearablesPage';
import { DigitalWellbeingPage } from './pages/DigitalWellbeingPage';
import { GoalsPage } from './pages/GoalsPage';
import { CareerPage } from './pages/CareerPage';
import { SafetyCenterPage } from './pages/SafetyCenterPage';
import { PrivacyCenterPage } from './pages/PrivacyCenterPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('guideme_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardOverview />} />
          <Route path="companion" element={<AICompanionPage />} />
          <Route path="facial-analysis" element={<FacialAnalysisPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="personality" element={<PersonalityPage />} />
          <Route path="stress" element={<StressDistressPage />} />
          <Route path="wearables" element={<WearablesPage />} />
          <Route path="digital-wellbeing" element={<DigitalWellbeingPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="career" element={<CareerPage />} />
          <Route path="safety" element={<SafetyCenterPage />} />
          <Route path="privacy" element={<PrivacyCenterPage />} />
        </Route>

        {/* Default fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
