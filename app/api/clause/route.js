import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API || "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const JSON_SCHEMA = `{
  "summary": "Plain English summary of the entire document in 3-5 sentences. Use simple language a 16-year-old can understand.",
  "documentType": "Type of document (e.g. Employment Contract, Rental Agreement, Terms of Service, NDA, etc.)",
  "riskScore": <number from 0 to 100 indicating overall risk level>,
  "riskLabel": "Low | Medium | High | Critical",
  "clauses": [
    {
      "id": "c1",
      "title": "Short clause name",
      "originalText": "The exact problematic text from the document (keep it short, max 2 sentences)",
      "plainMeaning": "What this clause actually means in plain English",
      "isHarmful": true or false,
      "harmLevel": "Low | Medium | High | Critical",
      "harmReason": "Why this clause is problematic or risky for the user",
      "legalSolution": "Specific replacement text or negotiation advice the user can actually use",
      "canBeReplaced": true or false,
      "replacementSuggestion": "A fair alternative clause text they could propose"
    }
  ],
  "userRights": ["Right 1 the user should know about", "Right 2", "Right 3"],
  "redFlags": ["Major concern 1", "Major concern 2"],
  "negotiationTips": ["Tip 1 on how to negotiate this document", "Tip 2"]
}`;

export async function POST(request) {
  try {
    const body = await request.json();
    const { mode, text, base64, mimeType } = body;

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API environment variable is not set." },
        { status: 500 }
      );
    }

    let geminiBody;

    if (mode === "paste") {
      if (!text || !text.trim()) {
        return NextResponse.json(
          { error: "No text provided." },
          { status: 400 }
        );
      }

      const prompt = `
You are a legal expert AI assistant helping everyday people understand contracts and legal documents. Analyze the following document and respond ONLY with valid JSON (no markdown, no backticks, no explanation outside JSON).

Document:
"""
${text}
"""

Return this exact JSON structure:
${JSON_SCHEMA}`;

      geminiBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
      };
    } else if (mode === "vision") {
      if (!base64 || !mimeType) {
        return NextResponse.json(
          { error: "No file data provided." },
          { status: 400 }
        );
      }

      const visionPrompt = `
You are a legal expert AI assistant helping everyday people understand contracts and legal documents. Analyze the document in this file and respond ONLY with valid JSON (no markdown, no backticks, no explanation outside JSON).

Return this exact JSON structure:
${JSON_SCHEMA}`;

      geminiBody = {
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: visionPrompt },
          ],
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
      };
    } else {
      return NextResponse.json(
        { error: "Invalid mode. Use 'paste' or 'vision'." },
        { status: 400 }
      );
    }

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(
        { error: err?.error?.message || "Gemini API error" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse Gemini response as JSON." },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}