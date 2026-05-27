import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { AuthProvider, useAuth } from './auth/AuthContext'
import { ThemeProvider } from './theme/ThemeContext'
import ProtectedRoute, { effectiveRole } from './auth/ProtectedRoute'

import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Placeholder from './pages/Placeholder'
import StudentDashboard from './pages/student/Dashboard'
import StudentCalendar from './pages/student/Calendar'
import StudentLessons from './pages/student/Lessons'
import StudentProfile from './pages/student/Profile'
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherSlots from './pages/teacher/Slots'
import TeacherRequests from './pages/teacher/Requests'
import TeacherLessons from './pages/teacher/Lessons'
import TeacherProfile from './pages/teacher/Profile'
import AdminDashboard from './pages/admin/Dashboard'
import AdminManagement from './pages/admin/Management'
import AdminSchedule from './pages/admin/Schedule'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{ style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' } }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated app shell */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            {/* Student */}
            <Route path="/student/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/calendar"  element={<ProtectedRoute role="student"><StudentCalendar /></ProtectedRoute>} />
            <Route path="/student/lessons"   element={<ProtectedRoute role="student"><StudentLessons /></ProtectedRoute>} />
            <Route path="/student/profile"   element={<ProtectedRoute role="student"><StudentProfile /></ProtectedRoute>} />

            {/* Teacher */}
            <Route path="/teacher/dashboard" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/slots"     element={<ProtectedRoute role="teacher"><TeacherSlots /></ProtectedRoute>} />
            <Route path="/teacher/requests"  element={<ProtectedRoute role="teacher"><TeacherRequests /></ProtectedRoute>} />
            <Route path="/teacher/lessons"   element={<ProtectedRoute role="teacher"><TeacherLessons /></ProtectedRoute>} />
            <Route path="/teacher/profile"   element={<ProtectedRoute role="teacher"><TeacherProfile /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin/dashboard"   element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/schedule"    element={<ProtectedRoute role="admin"><AdminSchedule /></ProtectedRoute>} />
            <Route path="/admin/management"  element={<ProtectedRoute role="admin"><AdminManagement /></ProtectedRoute>} />
            <Route path="/admin/progress"    element={<ProtectedRoute role="admin"><Placeholder title="Progress" /></ProtectedRoute>} />
            <Route path="/admin/settings"    element={<ProtectedRoute role="admin"><Placeholder title="Settings" /></ProtectedRoute>} />
          </Route>

          {/* Default route — send the user wherever their role belongs. */}
          <Route path="*" element={<RoleHomeRedirect />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

function RoleHomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  const homes = {
    admin:   '/admin/dashboard',
    teacher: '/teacher/dashboard',
    student: '/student/dashboard',
  }
  return <Navigate to={homes[effectiveRole(user)] || '/student/dashboard'} replace />
}
