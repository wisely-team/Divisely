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
You are an intelligent financial assistant for "Divisely", a group expense sharing app.

## DATA PROVIDED
${JSON.stringify(groupContext, null, 2)}

## USER QUESTION
"${question}"

## YOUR TASK
Analyze the data and answer the user's question. Do ALL calculations internally - NEVER show calculation steps to the user.

## CRITICAL CALCULATION LOGIC (Use internally, NEVER show to user)

### How to calculate who owes whom:

**Step 1: Calculate each person's BALANCE from expenses**
- If person PAID an expense: they get CREDIT (+) equal to the amount
- If person has a SPLIT in an expense: they owe DEBT (-) equal to their split amount
- Person's expense balance = (Total they paid as payer) - (Total of their split amounts)

**Step 2: Apply settlements**
A settlement record shows: {"from": "PersonA", "to": "PersonB", "amount": X}
This means: PersonA PAID PersonB the amount X
- PersonA: Gets CREDIT (+X) because they paid money out
- PersonB: Gets DEBT (-X) because they received money

**Step 3: Final balance**
Final Balance = Expense Balance + Settlements Paid Out - Settlements Received

**Step 4: Interpret final balances**
- POSITIVE balance = This person is OWED money (others owe them)
- NEGATIVE balance = This person OWES money (they owe others)

**Step 5: Match debtors to creditors**
Person with negative balance OWES person with positive balance.

## RESPONSE RULES
1. **NEVER show formulas, steps, or calculations**
2. **NEVER explain your reasoning**
3. Present ONLY the final result in a clean format
4. Use **bold** for names and amounts
5. Use the currency symbol from the data (₺, $, €, etc.)
6. Each debt should be on its OWN LINE for readability

## RESPONSE EXAMPLES

For "Who owes whom?" - Use SIMPLE BULLET LIST, each on separate line:

📊 **Settlement Summary**

• **asd** → **metin2**: **500₺**
• **asd** → **ertekin**: **240.67₺**

✅ 2 payments needed

---

For expense summaries:

📊 **Expenses**

• **ertekin** paid **1,000₺**
• **metin2** paid **500₺**

**Total:** 1,500₺

---

If everyone settled: "✅ **All settled!**"
If no expenses: "📭 No expenses yet."

Keep response simple and under 80 words.
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
