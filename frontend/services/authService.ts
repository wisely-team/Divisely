const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    userId: string;
    email: string;
    username: string;
    avatar?: string;
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

    const data = await handleResponse<{ accessToken: string; refreshToken: string; user: { userId: string; email: string; username: string; avatar?: string } }>(
      response,
      "login_failed"
    );
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user
    };
  },

  async register(email: string, password: string, username: string) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password, username })
    });

    return handleResponse<{ userId: string; email: string; username: string; createdAt: string }>(
      response,
      "register_failed"
    );
  },

  async forgotPassword(email: string) {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    return handleResponse<{ message: string }>(response, "forgot_password_failed");
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refreshToken })
    });

    return handleResponse<{ accessToken: string; refreshToken: string }>(response, "refresh_token_failed");
  },

  async verifyEmail(email: string, code: string) {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, code })
    });

    return handleResponse<{ message: string }>(response, "email_verification_failed");
  },

  async resendVerificationCode(email: string) {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    return handleResponse<{ message: string }>(response, "resend_verification_code_failed");
  },

  async resetPassword(email: string, code: string, newPassword: string) {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, code, newPassword })
    });

    return handleResponse<{ message: string }>(response, "reset_password_failed");
  }
};
