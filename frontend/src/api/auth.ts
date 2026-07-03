import client from './client';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export const login = async (credentials: LoginCredentials): Promise<TokenResponse> => {
  const response = await client.post<TokenResponse>('/token/', credentials);
  return response.data;
};

export const refreshToken = async (refresh: string): Promise<{ access: string }> => {
  const response = await client.post('/token/refresh/', { refresh });
  return response.data;
};
