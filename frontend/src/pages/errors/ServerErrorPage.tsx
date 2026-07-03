import { useNavigate } from 'react-router-dom';
import ErrorPage from '../../components/ErrorPage';

const ServerErrorPage = () => {
  const navigate = useNavigate();
  return (
    <ErrorPage
      code="500"
      icon="⚠️"
      image="/errors/500.png"
      title="Something went wrong"
      message="The server ran into an unexpected problem. Please try again in a moment."
      primaryAction={{ label: 'Retry', onClick: () => window.location.reload() }}
      secondaryAction={{ label: 'Back to Dashboard', onClick: () => navigate('/') }}
    />
  );
};

export default ServerErrorPage;
