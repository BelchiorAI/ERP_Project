import ErrorPage from '../../components/ErrorPage';

const OfflineErrorPage = () => (
  <ErrorPage
    icon="🔌"
    image="/errors/offline.png"
    title="Can't reach the server"
    message="We couldn't connect to the API. Make sure the backend server is running and try again."
    primaryAction={{ label: 'Retry', onClick: () => window.location.reload() }}
  />
);

export default OfflineErrorPage;
