import ErrorPage from '../../components/ErrorPage';
import { WifiOff } from 'lucide-react';

const OfflineErrorPage = () => (
  <ErrorPage
    icon={<WifiOff size={48} />}
    image="/errors/offline.png"
    title="Can't reach the server"
    message="We couldn't connect to the API. Make sure the backend server is running and try again."
    primaryAction={{ label: 'Retry', onClick: () => window.location.reload() }}
  />
);

export default OfflineErrorPage;
