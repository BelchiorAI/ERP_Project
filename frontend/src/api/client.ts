// Base Axios instance with JWT interceptor
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to a matching full-page error screen depending on how the request failed
const ERROR_PATHS = ['/login', '/403', '/500', '/offline'];

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const onErrorPage = ERROR_PATHS.includes(window.location.pathname);
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      if (!onErrorPage) {
        window.location.href = '/login';
      }
    } else if (status === 403) {
      if (!onErrorPage) {
        window.location.href = '/403';
      }
    } else if (status >= 500) {
      if (!onErrorPage) {
        window.location.href = '/500';
      }
    } else if (!error.response) {
      // Request never reached the server (backend down, no connection, etc.)
      if (!onErrorPage) {
        window.location.href = '/offline';
      }
    }

    return Promise.reject(error);
  }
);

export default client;
