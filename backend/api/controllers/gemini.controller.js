const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.warn('[GEMINI] WARNING: GEMINI_API_KEY is not set. AI features will not work.');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Analyze group finances
async function analyzeFinances(req, res) {
    try {
        if (!genAI) {
            return res.status(503).json({
                success: false,
                error: 'ai_not_configured',
                message: 'AI service is not configured'
            });
        }

        const { groupContext, question } = req.body;

        if (!groupContext || !question) {
            return res.status(400).json({
                success: false,
                error: 'missing_fields'
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return res.json({
            success: true,
            data: { answer: text }
        });

    } catch (error) {
        console.error('[GEMINI] analyzeFinances error:', error);
        return res.status(500).json({
            success: false,
            error: 'ai_error',
            message: error.message
        });
    }
}

// Analyze receipt image
async function analyzeReceipt(req, res) {
    try {
        if (!genAI) {
            return res.status(503).json({
                success: false,
                error: 'ai_not_configured'
            });
        }

        const { imageBase64, mimeType } = req.body;

        if (!imageBase64) {
            return res.status(400).json({
                success: false,
                error: 'missing_image'
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            You are an OCR and receipt analysis assistant. Analyze this receipt image and extract:

            1. Description: What was purchased (e.g., "Dinner at Restaurant Name")
            2. Total Amount: The final total amount paid (as a number, without currency symbols)
            3. Date: The date of the transaction in YYYY-MM-DD format

            Return ONLY a valid JSON object:
            {
                "description": "string",
                "amount": number,
                "date": "YYYY-MM-DD"
            }
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: imageBase64
                }
            }
        ]);

        const response = await result.response;
        const text = response.text().trim();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return res.status(422).json({
                success: false,
                error: 'parse_error',
                message: 'Could not extract receipt data'
            });
        }

        const data = JSON.parse(jsonMatch[0]);

        return res.json({
            success: true,
            data: {
                description: data.description,
                amount: parseFloat(data.amount),
                date: data.date
            }
        });

    } catch (error) {
        console.error('[GEMINI] analyzeReceipt error:', error);
        return res.status(500).json({
            success: false,
            error: 'ai_error',
            message: error.message
        });
    }
}

module.exports = { analyzeFinances, analyzeReceipt };
