import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import { ToastProvider } from '@/lib/ToastContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Risks } from '@/pages/Risks';
import { RiskHeatmapPage } from '@/pages/RiskHeatmapPage';
import { Controls } from '@/pages/Controls';
import { FrameworkMapping } from '@/pages/FrameworkMapping';
import { Gaps } from '@/pages/Gaps';
import { Remediation } from '@/pages/Remediation';
import { Assets } from '@/pages/Assets';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Public Auth Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Enterprise GRC Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="risks" element={<Risks />} />
                <Route path="heatmap" element={<RiskHeatmapPage />} />
                <Route path="controls" element={<Controls />} />
                <Route path="frameworks" element={<FrameworkMapping />} />
                <Route path="gaps" element={<Gaps />} />
                <Route path="remediation" element={<Remediation />} />
                <Route path="assets" element={<Assets />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
