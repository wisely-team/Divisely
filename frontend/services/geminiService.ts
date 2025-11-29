import { GoogleGenAI } from "@google/genai";
import { Expense, Group, User } from "../types";

// Initialize the client
// NOTE: Ideally, the key comes from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeGroupFinances = async (
  group: Group,
  expenses: Expense[],
  users: User[],
  question: string
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Prepare context for the AI
    const groupContext = {
      groupName: group.name,
      members: users.filter(u => group.members.includes(u.id)).map(u => ({ id: u.id, name: u.name })),
      expenses: expenses.map(e => ({
        description: e.description,
        amount: e.amount,
        payer: users.find(u => u.id === e.payerId)?.name,
        date: e.date,
        category: e.category
      }))
    };

    const prompt = `
      You are an intelligent financial assistant for a group expense sharing app called "Divisely".
      
      Context Data:
      ${JSON.stringify(groupContext, null, 2)}

      User Question: "${question}"

      Instructions:
      1. Answer the user's question based strictly on the provided data.
      2. If asking for a summary, provide a concise breakdown of total spending and top categories.
      3. Be friendly and helpful.
      4. Keep the response under 150 words.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "I couldn't analyze the data at this moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to the AI assistant right now. Please check your API key.";
  }
};