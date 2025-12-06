const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface AddExpensePayload {
  groupId: string;
  description: string;
  amount: number;
  payerId: string;
  date?: string;
  splits: Array<{ userId: string; amount: number }>;
}

interface AddExpenseResponse {
  expenseId: string;
  groupId: string;
  description: string;
  amount: number;
  payerId: string;
  payerName?: string;
  splits: Array<{ userId: string; displayName?: string; amount: number }>;
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

export const expenseService = {
  async addExpense(payload: AddExpensePayload, accessToken: string) {
    const paidAt = payload.date ? new Date(payload.date).toISOString() : undefined;

    const response = await fetch(`${API_BASE_URL}/add_expense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        groupId: payload.groupId,
        description: payload.description,
        amount: payload.amount,
        payerId: payload.payerId,
        paidAt,
        splits: payload.splits.map(split => ({
          userId: split.userId,
          amount: split.amount
        }))
      })
    });

    return handleResponse<AddExpenseResponse>(response, 'add_expense_failed');
  }
};
