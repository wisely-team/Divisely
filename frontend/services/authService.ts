const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    userId: string;
    email: string;
    displayName: string;
  };
}

const handleResponse = async <T>(response: Response, defaultError: string): Promise<T> => {
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    const errorMessage = data?.error || defaultError;
    throw new Error(errorMessage);
  }
  return data.data as T;
};

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await handleResponse<{ accessToken: string; refreshToken: string; user: { userId: string; email: string; displayName: string } }>(
      response,
      "login_failed"
    );
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user
    };
  },

  async register(email: string, password: string, displayName: string) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password, displayName })
    });

    return handleResponse<{ userId: string; email: string; displayName: string; createdAt: string }>(
      response,
      "register_failed"
    );
  }
};
