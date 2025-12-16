import { fetchWithTokenRefresh } from '../utils/tokenRefresh';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface SimplifiedDebt {
  from: { userId: string; displayName?: string };
  to: { userId: string; displayName?: string };
  amount: number;
}

export interface GroupBalancesResponse {
  groupId: string;
  simplifiedDebts: SimplifiedDebt[];
  memberBalances: { userId: string; displayName?: string; balance: number }[];
}

const handleResponse = async <T>(response: Response, defaultError: string): Promise<T> => {
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    const errorMessage = data?.error || defaultError;
    throw new Error(errorMessage);
  }
  return data.data as T;
};

export const balanceService = {
  async getGroupBalances(groupId: string, accessToken: string) {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/groups/${groupId}/balances`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return handleResponse<GroupBalancesResponse>(response, 'fetch_balances_failed');
  }
};
