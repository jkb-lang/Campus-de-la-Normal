import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LandingPage } from './pages/public/LandingPage';
import { DashboardRouter } from './pages/dashboard/DashboardRouter';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { SubjectWorkspace } from './pages/teacher/SubjectWorkspace';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentSubjectView } from './pages/student/StudentSubjectView';
import { StudentLibraryPage } from './pages/student/StudentLibraryPage';
import { AITutorPage } from './pages/ai/AITutorPage';
import { PreviousSubjectsPage } from './pages/previousSubjects/PreviousSubjectsPage';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { AdminPanel } from './pages/admin/AdminPanel';
import { ProfilePage } from './pages/profile/ProfilePage';

export function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Protected Campus Application Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Role-adaptive Dashboard */}
              <Route path="/panel" element={<DashboardRouter />} />

              {/* Teacher Routes */}
              <Route path="/profesor/materias" element={<TeacherDashboard />} />
              <Route path="/profesor/materia/:id" element={<SubjectWorkspace />} />
              <Route path="/profesor/biblioteca" element={<TeacherDashboard />} />
              <Route path="/profesor/clases" element={<TeacherDashboard />} />
              <Route path="/profesor/actividades" element={<TeacherDashboard />} />

              {/* Student Routes */}
              <Route path="/estudiante/materias" element={<StudentDashboard />} />
              <Route path="/estudiante/materia/:id" element={<StudentSubjectView />} />
              <Route path="/estudiante/biblioteca" element={<StudentLibraryPage />} />
              <Route path="/estudiante/actividades" element={<StudentDashboard />} />

              {/* Shared Educational Modules */}
              <Route path="/tutor-ia" element={<AITutorPage />} />
              <Route path="/materias-previas" element={<PreviousSubjectsPage />} />
              <Route path="/calendario" element={<CalendarPage />} />
              <Route path="/perfil" element={<ProfilePage />} />

              {/* Admin Panel */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
