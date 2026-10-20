import React from 'react';
import { AttendanceProvider, useAttendance } from './context/AttendanceContext';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/Student/StudentDashboard';
import { TeacherDashboard } from './components/Teacher/TeacherDashboard';
import { Login } from './components/Auth/Login';
import './App.css';

const MainLayout = () => {
  const { role, isAuthenticated, markAttendanceFromScan } = useAttendance();

  React.useEffect(() => {
    if (isAuthenticated && role === 'student') {
      const params = new URLSearchParams(window.location.search);
      const scanCode = params.get('scan');
      if (scanCode) {
        markAttendanceFromScan(scanCode);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [isAuthenticated, role, markAttendanceFromScan]);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="main-content">
        {role === 'student' ? <StudentDashboard /> : <TeacherDashboard />}
      </main>


    </div>
  );
};

export default function App() {
  return (
    <AttendanceProvider>
      <MainLayout />
    </AttendanceProvider>
  );
}
