import { useNavigate } from 'react-router-dom';
import ErrorPage from '../../components/ErrorPage';
import { FileQuestion } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <ErrorPage
      code="404"
      icon={<FileQuestion size={48} />}
      image="/errors/404.png"
      title="Page not found"
      message="The page you're looking for doesn't exist or may have been moved."
      primaryAction={{ label: 'Back to Dashboard', onClick: () => navigate('/') }}
    />
  );
};

export default NotFoundPage;
