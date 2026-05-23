import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ⚠️ In-memory chat history (like your Flask global variable)
// NOTE: This resets on server restart / serverless cold start
let chatHistory = [];

export async function POST(req) {
  try {
    const body = await req.json();

    if (!body) {
      return Response.json({ error: "No JSON body received" }, { status: 400 });
    }

    const userMessage = (body.message || "").trim();

    if (!userMessage) {
      return Response.json({ error: "No message provided" }, { status: 400 });
    }

    // Add user message to history (Gemini format)
    chatHistory.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    // Start chat with previous history (excluding latest message)
    const chat = model.startChat({
      history: chatHistory.slice(0, -1),
    });

    const result = await chat.sendMessage(userMessage);
    const botReply = result.response.text();

    // Add model response to history
    chatHistory.push({
      role: "model",
      parts: [{ text: botReply }],
    });

    return Response.json({
      reply: botReply,
      history_length: chatHistory.length,
    });
  } catch (error) {
    // rollback last user message on failure
    chatHistory.pop();

    console.error("Gemini error:", error);

    return Response.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}