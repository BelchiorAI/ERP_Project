import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ErrorAction {
  label: string;
  onClick: () => void;
}

interface ErrorPageProps {
  code?: string;
  icon?: React.ReactNode;
  /** Path under /public, e.g. "/errors/404.png" — falls back to `icon` until the file is dropped in. */
  image?: string;
  title: string;
  message: string;
  primaryAction?: ErrorAction;
  secondaryAction?: ErrorAction;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  code, icon, image, title, message, primaryAction, secondaryAction,
}) => {
  const navigate = useNavigate();
  const [imageFailed, setImageFailed] = useState(false);

  const defaultPrimary: ErrorAction = {
    label: 'Back to Dashboard',
    onClick: () => navigate('/'),
  };

  const primary = primaryAction ?? defaultPrimary;

  return (
    <div className="error-page">
      <div className="error-card">
        {image && !imageFailed ? (
          <img
            src={image}
            alt=""
            className="error-image"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="error-icon" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {icon}
          </div>
        )}
        {code && <div className="error-code">{code}</div>}
        <h1>{title}</h1>
        <p>{message}</p>
        <div className="error-actions">
          <button className="btn btn-primary" onClick={primary.onClick}>
            {primary.label}
          </button>
          {secondaryAction && (
            <button className="btn btn-secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
