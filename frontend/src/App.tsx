import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import TimesheetsPage from './pages/TimesheetsPage';
import LeaveRequestsPage from './pages/LeaveRequestsPage';
import RegisterEmployeePage from './pages/RegisterEmployeePage';
import NotFoundPage from './pages/errors/NotFoundPage';
import ForbiddenPage from './pages/errors/ForbiddenPage';
import ServerErrorPage from './pages/errors/ServerErrorPage';
import OfflineErrorPage from './pages/errors/OfflineErrorPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <EmployeesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/new"
        element={
          <RoleProtectedRoute
            allow={(user) => user.role === 'admin' || (user.role === 'manager' && user.can_create_users)}
          >
            <RegisterEmployeePage />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/timesheets"
        element={
          <ProtectedRoute>
            <TimesheetsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave-requests"
        element={
          <ProtectedRoute>
            <LeaveRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/500" element={<ServerErrorPage />} />
      <Route path="/offline" element={<OfflineErrorPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
