import { Expense, Group, User } from "../types";
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
  users: User[],
  question: string
): Promise<string> => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      return "Please log in to use the AI assistant.";
    }

    // Prepare context for the AI
    const groupContext = {
      groupName: group.name,
      members: users.filter(u => group.members.includes(u.id)).map(u => ({ id: u.id, name: u.name })),
      expenses: expenses.map(e => ({
        description: e.description,
        amount: e.amount,
        payer: users.find(u => u.id === e.payerId)?.name,
        date: e.date,
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