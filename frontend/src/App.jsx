import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layout
import DashboardLayout from './components/DashboardLayout';

// Core Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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

// Admin Panel
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminFarmersPage from './pages/admin/AdminFarmersPage';
import AdminActivityPage from './pages/admin/AdminActivityPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated Routes */}
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

          {/* Admin Panel - separate auth system */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="farmers" element={<AdminFarmersPage />} />
            <Route path="activity" element={<AdminActivityPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
