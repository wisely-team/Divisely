import { fetchWithTokenRefresh } from '../utils/tokenRefresh';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface SettleUpPayload {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  description?: string;
  date?: string;
}

interface SettleUpResponse {
  settlementId: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  note?: string;
  settledAt?: string;
  createdAt?: string;
}

const handleResponse = async <T>(response: Response, defaultError: string): Promise<T> => {
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    const errorMessage = data?.error || defaultError;
    throw new Error(errorMessage);
  }
  return data.data as T;
};

export const settlementService = {
  async settleUp(payload: SettleUpPayload, accessToken: string) {
    const settledAt = payload.date ? new Date(payload.date).toISOString() : undefined;
    const createdAt = new Date().toISOString();

    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/settlements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        groupId: payload.groupId,
        fromUserId: payload.fromUserId,
        toUserId: payload.toUserId,
        amount: payload.amount,
        description: payload.description,
        settledAt,
        createdAt
      })
    });

    return handleResponse<SettleUpResponse>(response, 'settle_up_failed');
  },

  async getSettlements(groupId: string, accessToken: string) {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/settlements/${groupId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return handleResponse<{ groupId: string; settlements: SettleUpResponse[] }>(response, 'fetch_settlements_failed');
  },

  async deleteSettlement(settlementId: string, accessToken: string) {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/settlement/${settlementId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return handleResponse<null>(response, 'delete_settlement_failed');
  }
};
