import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { TeacherDashboard } from '../teacher/TeacherDashboard';
import { StudentDashboard } from '../student/StudentDashboard';
import { AdminPanel } from '../admin/AdminPanel';

export const DashboardRouter = () => {
  const { role, isAdmin, isTeacher } = useAuth();

  if (isAdmin) {
    return <AdminPanel />;
  }

  if (isTeacher) {
    return <TeacherDashboard />;
  }

  return <StudentDashboard />;
};
