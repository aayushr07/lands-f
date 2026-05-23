import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const body = await req.json();
        const { address, landType, sqft } = body;

        if (!address || !landType || !sqft) {
            return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are a professional Indian real estate valuation expert.
User input:
- Address / Landmark: "${address}"
- Land Type: ${landType}
- Land Size: ${Math.round(sqft)} sq.ft
Instructions:
1. Identify the exact locality and city from the address.
2. Provide realistic 2024-2025 market rates for ${landType} land in that locality.
3. Return ONLY a raw JSON object — no markdown, no code fences, no extra text.
Required JSON:
{
  "areaIdentified": "Full area name, City, State",
  "city": "City name",
  "locality": "Specific neighborhood",
  "landType": "${landType}",
  "sizeInSqft": ${Math.round(sqft)},
  "marketOverview": "2-3 sentence summary of market in this area",
  "ratePerSqft": { "low": 0, "mid": 0, "high": 0 },
  "totalValue":  { "low": 0, "mid": 0, "high": 0 },
  "priceFactors": [
    { "factor": "name", "impact": "positive", "detail": "one sentence" },
    { "factor": "name", "impact": "negative", "detail": "one sentence" },
    { "factor": "name", "impact": "positive", "detail": "one sentence" }
  ],
  "marketTrend": "rising",
  "trendNote": "one sentence about recent price movement",
  "nearbyLandmarks": ["landmark1", "landmark2", "landmark3"],
  "dataConfidence": "high",
  "disclaimer": "short accuracy note"
}
Replace 0 values with real numbers. marketTrend must be exactly: rising, stable, or declining. dataConfidence must be exactly: high, medium, or low.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(cleanedText);

        return NextResponse.json({ success: true, data: parsedData });
    } catch (error) {
        console.error('Valuation error:', error);
        return NextResponse.json({ success: false, message: 'Failed to fetch valuation: ' + error.message }, { status: 500 });
    }
}
