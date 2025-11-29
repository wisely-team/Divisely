import { GoogleGenAI } from "@google/genai";
import { Expense, Group, User } from "../types";

// Initialize the client
// NOTE: Ideally, the key comes from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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

export const analyzeReceiptImage = async (base64Image: string): Promise<ReceiptData | null> => {
  try {
    const model = 'gemini-2.5-flash';

    const prompt = `
      You are an OCR and receipt analysis assistant. Analyze this receipt image and extract the following information:

      1. Description: What was purchased (e.g., "Dinner at Restaurant Name", "Groceries at Store Name")
      2. Total Amount: The final total amount paid (as a number, without currency symbols)
      3. Date: The date of the transaction in YYYY-MM-DD format

      Instructions:
      - Extract only the TOTAL amount (not subtotals, tax, or tips separately)
      - If multiple items are listed, create a general description like "Groceries" or "Restaurant meal"
      - If you cannot find a date, use today's date
      - If you cannot confidently extract the data, return null

      Return ONLY a valid JSON object in this exact format (no other text):
      {
        "description": "string",
        "amount": number,
        "date": "YYYY-MM-DD"
      }
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }
      ],
    });

    const text = response.text?.trim() || '';

    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', text);
      return null;
    }

    const data = JSON.parse(jsonMatch[0]);

    // Validate the extracted data
    if (!data.description || typeof data.amount !== 'number' || !data.date) {
      console.error('Invalid data structure:', data);
      return null;
    }

    // Ensure date is in correct format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
      // Try to parse and reformat the date
      const parsedDate = new Date(data.date);
      if (!isNaN(parsedDate.getTime())) {
        data.date = parsedDate.toISOString().split('T')[0];
      } else {
        // Use today's date as fallback
        data.date = new Date().toISOString().split('T')[0];
      }
    }

    return {
      description: data.description,
      amount: parseFloat(data.amount.toString()),
      date: data.date
    };

  } catch (error) {
    console.error("Receipt analysis error:", error);
    return null;
  }
};