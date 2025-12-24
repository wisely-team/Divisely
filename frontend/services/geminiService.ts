import { Expense, Group, Settlement, User } from "../types";
import { fetchWithTokenRefresh } from "../utils/tokenRefresh";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface ReceiptData {
  description: string;
  amount: number;
  date: string;
}

export const analyzeGroupFinances = async (
  group: Group,
  expenses: Expense[],
  settlements: Settlement[],
  users: User[],
  question: string
): Promise<string> => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      return "Please log in to use the AI assistant.";
    }

    // Get group members
    const groupMembers = users.filter(u => group.members.includes(u.id));
    const memberCount = groupMembers.length;

    // Prepare context for the AI with smart defaults
    const groupContext = {
      groupName: group.name,
      memberCount,
      members: groupMembers.map(u => ({ id: u.id, name: u.name })),
      totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
      totalSettlements: settlements.reduce((sum, s) => sum + s.amount, 0),
      expenses: expenses.map(e => {
        // If no splits provided, assume equal split among all members
        const splits = e.splits && e.splits.length > 0
          ? e.splits.map(s => ({
            userName: users.find(u => u.id === s.userId)?.name || 'Unknown',
            amount: s.amount
          }))
          : groupMembers.map(u => ({
            userName: u.name,
            amount: e.amount / memberCount
          }));

        return {
          description: e.description,
          amount: e.amount,
          payer: users.find(u => u.id === e.payerId)?.name || 'Unknown',
          date: e.date,
          splits
        };
      }),
      settlements: settlements.map(s => ({
        from: users.find(u => u.id === s.fromUserId)?.name || 'Unknown',
        to: users.find(u => u.id === s.toUserId)?.name || 'Unknown',
        amount: s.amount,
        date: s.settledAt || s.createdAt
      }))
    };

    const response = await fetchWithTokenRefresh(`${API_URL}/gemini/analyze-finances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ groupContext, question })
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.error === 'ai_not_configured') {
        return "AI assistant is not configured on the server. Please contact support.";
      }
      throw new Error(data.message || 'AI request failed');
    }

    return data.data?.answer || "I couldn't analyze the data at this moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to the AI assistant right now.";
  }
};

export const analyzeReceiptImage = async (base64Image: string): Promise<ReceiptData | null> => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      console.error("No access token for receipt analysis");
      return null;
    }

    const response = await fetchWithTokenRefresh(`${API_URL}/gemini/analyze-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        imageBase64: base64Image,
        mimeType: 'image/jpeg'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Receipt analysis failed:", data);
      return null;
    }

    return {
      description: data.data.description,
      amount: parseFloat(data.data.amount.toString()),
      date: data.data.date
    };

  } catch (error) {
    console.error("Receipt analysis error:", error);
    return null;
  }
};