import { fetchWithTokenRefresh } from '../utils/tokenRefresh';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface UpdateProfilePayload {
  displayName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface UserProfileResponse {
  userId: string;
  email: string;
  displayName: string;
  updatedAt?: string;
}

const handleResponse = async <T>(response: Response, defaultError: string): Promise<T> => {
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    const errorMessage = data?.error || defaultError;
    throw new Error(errorMessage);
  }
  return data.data as T;
};

export const userService = {
  async getProfile(accessToken: string) {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return handleResponse<UserProfileResponse>(response, 'fetch_profile_failed');
  },

  async updateProfile(payload: UpdateProfilePayload, accessToken: string) {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });

    return handleResponse<UserProfileResponse>(response, 'update_profile_failed');
  }
};
