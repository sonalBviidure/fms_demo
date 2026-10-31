import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layout
import DashboardLayout from './components/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Authenticated Pages
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';

// Farm Management & AI Pages
import CropsPage from './pages/placeholders/CropsPage';
import ExpensesPage from './pages/placeholders/ExpensesPage';
import HarvestSalesPage from './pages/placeholders/HarvestSalesPage';
import ReportsPage from './pages/placeholders/ReportsPage';
import AICropRecPage from './pages/placeholders/AICropRecPage';
import AIYieldPredPage from './pages/placeholders/AIYieldPredPage';
import AIProfitPredPage from './pages/placeholders/AIProfitPredPage';

// System Admin Operations Suite — Simplified Architecture
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminFarmerLookupPage from './pages/admin/AdminFarmerLookupPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAIMonitoringPage from './pages/admin/AdminAIMonitoringPage';
import AdminSystemMonitoringPage from './pages/admin/AdminSystemMonitoringPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

// Legacy / Deep Admin Pages
import AdminFarmersPage from './pages/admin/AdminFarmersPage';
import AdminCropsOperationsPage from './pages/admin/AdminCropsOperationsPage';
import AdminFieldsPage from './pages/admin/AdminFieldsPage';
import AdminFinancialsPage from './pages/admin/AdminFinancialsPage';
import AdminMandiPricesPage from './pages/admin/AdminMandiPricesPage';
import AdminAIAdvisoryPage from './pages/admin/AdminAIAdvisoryPage';
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminActivityPage from './pages/admin/AdminActivityPage';
import AdminSystemHealthPage from './pages/admin/AdminSystemHealthPage';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated Farmer Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Crop & Expense Management */}
              <Route path="/crops" element={<CropsPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/harvest-sales" element={<HarvestSalesPage />} />

              {/* Financial Reports & AI Advisory */}
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/ai-crop-recommendation" element={<AICropRecPage />} />
              <Route path="/ai-profit-prediction" element={<AIProfitPredPage />} />
              <Route path="/ai-yield-prediction" element={<AIYieldPredPage />} />
            </Route>
          </Route>

          {/* System Admin Panel — Simplified Architecture */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />

            {/* Core Admin Streamlined Pages */}
            <Route path="farmer-lookup" element={<AdminFarmerLookupPage />} />
            <Route path="farmer lookup" element={<AdminFarmerLookupPage />} />
            <Route path="farmer%20lookup" element={<AdminFarmerLookupPage />} />
            <Route path="farmer_lookup" element={<AdminFarmerLookupPage />} />
            <Route path="farmer" element={<AdminFarmerLookupPage />} />
            <Route path="farmers" element={<AdminFarmerLookupPage />} />
            <Route path="lookup" element={<AdminFarmerLookupPage />} />

            <Route path="users" element={<AdminUsersPage />} />
            <Route path="ai-monitoring" element={<AdminAIMonitoringPage />} />
            <Route path="system" element={<AdminSystemMonitoringPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />

            {/* Aliases & Fallbacks */}
            <Route path="ai-advisory" element={<AdminAIMonitoringPage />} />
            <Route path="crops" element={<AdminCropsOperationsPage />} />
            <Route path="fields" element={<AdminFieldsPage />} />
            <Route path="financials" element={<AdminFinancialsPage />} />
            <Route path="mandi" element={<AdminMandiPricesPage />} />
            <Route path="announcements" element={<AdminAnnouncementsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="activity" element={<AdminActivityPage />} />

            {/* Admin Wildcard Fallback */}
            <Route path="*" element={<Navigate to="farmer-lookup" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
