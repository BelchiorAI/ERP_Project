import { useNavigate } from 'react-router-dom';
import ErrorPage from '../../components/ErrorPage';
import { ShieldAlert } from 'lucide-react';

const ForbiddenPage = () => {
  const navigate = useNavigate();
  return (
    <ErrorPage
      code="403"
      icon={<ShieldAlert size={48} />}
      image="/errors/403.jpg"
      title="Access denied"
      message="You don't have permission to view this page. If you think this is a mistake, contact your administrator."
      primaryAction={{ label: 'Back to Dashboard', onClick: () => navigate('/') }}
    />
  );
};

export default ForbiddenPage;
