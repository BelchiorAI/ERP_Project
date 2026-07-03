import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allow: (user: NonNullable<ReturnType<typeof useAuth>['user']>) => boolean;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ children, allow }) => {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      {user && allow(user) ? <>{children}</> : <Navigate to="/403" replace />}
    </ProtectedRoute>
  );
};

export default RoleProtectedRoute;
