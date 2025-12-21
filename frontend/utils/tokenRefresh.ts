import { authService } from '../services/authService';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

export async function fetchWithTokenRefresh(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = localStorage.getItem('accessToken');

  if (accessToken && options.headers) {
    (options.headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, options);

  // If token expired, try to refresh
  if (response.status === 401) {
    // Clone the response so we can read the body without consuming the original
    const clonedResponse = response.clone();
    const data = await clonedResponse.json().catch(() => ({}));

    // Only try to refresh token for token-related errors
    if (data?.error === 'token_expired' || data?.error === 'invalid_token') {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/#/login';
        throw new Error('Session expired. Please login again.');
      }

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const tokens = await authService.refreshToken(refreshToken);
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);

          isRefreshing = false;
          onRefreshed(tokens.accessToken);

          // Retry the original request with new token
          if (options.headers) {
            (options.headers as Record<string, string>)['Authorization'] = `Bearer ${tokens.accessToken}`;
          }
          response = await fetch(url, options);
        } catch (error) {
          isRefreshing = false;
          refreshSubscribers = [];

          // Refresh failed, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/#/login';
          throw new Error('Session expired. Please login again.');
        }
      } else {
        // Wait for the refresh to complete
        const newToken = await new Promise<string>((resolve) => {
          subscribeTokenRefresh((token: string) => {
            resolve(token);
          });
        });

        // Retry with new token
        if (options.headers) {
          (options.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
        }
        response = await fetch(url, options);
      }
    }
    // If it's not a token error, the original response is still available to return
  }

  return response;
}
