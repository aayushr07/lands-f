"use client";

import { useState, useRef, useCallback } from "react";

// ─── Gemini API helper ────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyByvqsKsxd7xEuomdc1mYlWz5MjM_tn0js";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function analyzeDocumentWithGemini(text) {
  const prompt = `
You are a legal expert AI assistant helping everyday people understand contracts and legal documents. Analyze the following document and respond ONLY with valid JSON (no markdown, no backticks, no explanation outside JSON).

Document:
"""
${text}
"""

Return this exact JSON structure:
{
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
}
`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
  };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || "Gemini API error");
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

async function extractFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve({
      base64: e.target.result.split(",")[1],
      mimeType: file.type,
    });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Nature-themed risk colors ────────────────────────────────────────────────
const riskColors = {
  Low:      { bg: "#f0faf2", text: "#2d7a3a", border: "#a7d9b0" },
  Medium:   { bg: "#fffbeb", text: "#92600a", border: "#f5cc7a" },
  High:     { bg: "#fff5f0", text: "#b84a2e", border: "#f0b09a" },
  Critical: { bg: "#fdf0f5", text: "#8b1a4a", border: "#e8a0c0" },
};

const riskBarColor = {
  Low: "#3aad4f",
  Medium: "#d4930a",
  High: "#c05030",
  Critical: "#8b1a4a",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskBadge({ level, size = "sm" }) {
  const c = riskColors[level] || riskColors.Low;
  const pad = size === "lg" ? "6px 18px" : "3px 10px";
  const fs = size === "lg" ? "13px" : "10px";
  return (
    <span style={{
      background: c.bg, color: c.text,
      border: `1.5px solid ${c.border}`,
      borderRadius: "999px", padding: pad,
      fontSize: fs, fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", whiteSpace: "nowrap",
    }}>
      {level}
    </span>
  );
}

function ScoreRing({ score }) {
  const color = score >= 75 ? "#b84a2e" : score >= 50 ? "#c08020" : score >= 25 ? "#6aaa3a" : "#2d7a3a";
  const radius = 44, circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={110} height={110} viewBox="0 0 110 110">
        <circle cx={55} cy={55} r={radius} fill="none" stroke="#d9ead9" strokeWidth={10} />
        <circle cx={55} cy={55} r={radius} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }}
        />
        <text x={55} y={60} textAnchor="middle" fill={color} fontSize={24} fontWeight={800} fontFamily="'Playfair Display', serif">{score}</text>
      </svg>
      <span style={{ color: "#7aaa7a", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Risk Score</span>
    </div>
  );
}

function LeafDecor({ style }) {
  return (
    <svg viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <path d="M40 110 C40 110 10 70 15 35 C20 5 40 2 40 2 C40 2 60 5 65 35 C70 70 40 110 40 110Z" fill="#c8e6c2" opacity="0.5"/>
      <path d="M40 110 L40 2" stroke="#8dc88a" strokeWidth="1.5" opacity="0.4"/>
      <path d="M40 40 C30 30 15 33 15 33" stroke="#8dc88a" strokeWidth="1" opacity="0.3"/>
      <path d="M40 55 C50 43 65 40 65 40" stroke="#8dc88a" strokeWidth="1" opacity="0.3"/>
      <path d="M40 72 C28 62 18 65 18 65" stroke="#8dc88a" strokeWidth="1" opacity="0.3"/>
    </svg>
  );
}

function ClauseCard({ clause, index }) {
  const [open, setOpen] = useState(false);
  const c = riskColors[clause.harmLevel] || riskColors.Low;
  return (
    <div style={{
      background: clause.isHarmful ? c.bg : "#f7fdf7",
      border: `1.5px solid ${clause.isHarmful ? c.border : "#c0dfc0"}`,
      borderRadius: 16,
      marginBottom: 12,
      overflow: "hidden",
      boxShadow: open ? `0 4px 24px ${c.border}66` : "0 1px 4px rgba(60,100,60,0.07)",
      transition: "box-shadow 0.25s",
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", background: "none", border: "none", cursor: "pointer",
        padding: "16px 20px", display: "flex", alignItems: "center", gap: 12,
        textAlign: "left",
      }}>
        <span style={{
          width: 30, height: 30, borderRadius: 8,
          background: clause.isHarmful ? c.border : "#c8e8c0",
          color: clause.isHarmful ? c.text : "#2d7a3a",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, flexShrink: 0,
          fontFamily: "'DM Mono', monospace",
        }}>{index + 1}</span>
        <span style={{ flex: 1, color: "#1a3a1a", fontWeight: 600, fontSize: 15, fontFamily: "'Playfair Display', serif" }}>
          {clause.title}
        </span>
        {clause.isHarmful && <RiskBadge level={clause.harmLevel} />}
        {!clause.isHarmful && (
          <span style={{ color: "#2d7a3a", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", background: "#e4f5e4", borderRadius: 999, padding: "3px 10px", border: "1px solid #a7d9b0" }}>✓ Safe</span>
        )}
        <span style={{ color: "#8aaa8a", fontSize: 16, marginLeft: 4 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#f0f5ee", borderRadius: 12, padding: "12px 16px", borderLeft: "3px solid #a0b898" }}>
            <div style={{ color: "#5a7a5a", fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.12em", fontFamily: "'DM Mono', monospace" }}>Original Clause</div>
            <div style={{ color: "#5a7a5a", fontSize: 13, fontStyle: "italic", lineHeight: 1.7 }}>"{clause.originalText}"</div>
          </div>

          <div style={{ background: "#eaf6f0", borderRadius: 12, padding: "12px 16px", borderLeft: "3px solid #4aaa7a" }}>
            <div style={{ color: "#2a7a5a", fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.12em", fontFamily: "'DM Mono', monospace" }}>💬 What It Actually Means</div>
            <div style={{ color: "#1a4a3a", fontSize: 14, lineHeight: 1.8 }}>{clause.plainMeaning}</div>
          </div>

          {clause.isHarmful && (
            <>
              <div style={{ background: c.bg, borderRadius: 12, padding: "12px 16px", borderLeft: `3px solid ${c.border}` }}>
                <div style={{ color: c.text, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.12em", fontFamily: "'DM Mono', monospace" }}>⚠️ Why This Is Risky For You</div>
                <div style={{ color: "#4a2a1a", fontSize: 14, lineHeight: 1.8 }}>{clause.harmReason}</div>
              </div>

              {clause.legalSolution && (
                <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "12px 16px", borderLeft: "3px solid #3aad4f" }}>
                  <div style={{ color: "#1a6a2a", fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.12em", fontFamily: "'DM Mono', monospace" }}>⚖️ Legal Solution / What You Can Do</div>
                  <div style={{ color: "#1a3a1a", fontSize: 14, lineHeight: 1.8 }}>{clause.legalSolution}</div>
                </div>
              )}

              {clause.canBeReplaced && clause.replacementSuggestion && (
                <div style={{ background: "#f5fbf0", borderRadius: 12, padding: "12px 16px", borderLeft: "3px solid #7aaa4a" }}>
                  <div style={{ color: "#4a7a1a", fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.12em", fontFamily: "'DM Mono', monospace" }}>✏️ Suggested Replacement</div>
                  <div style={{ color: "#3a5a1a", fontSize: 13, fontStyle: "italic", lineHeight: 1.7 }}>"{clause.replacementSuggestion}"</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClauseAIPage() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [pasteText, setPasteText] = useState("");
  const [inputMode, setInputMode] = useState("upload");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("clauses");
  const fileRef = useRef();

  const loadingMessages = [
    "Reading your document...",
    "Scanning for legal red flags...",
    "Translating lawyer-speak...",
    "Identifying harmful clauses...",
    "Preparing your plain-English report...",
  ];

  const handleFile = (f) => {
    if (!f) return;
    const isImage = f.type.startsWith("image/");
    const isPdf = f.type === "application/pdf";
    if (!isImage && !isPdf) {
      setError("Please upload a photo (JPG, PNG, WEBP, etc.) or a PDF file.");
      return;
    }
    setFile(f);
    setError("");
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  }, []);

  const analyze = async () => {
    setError("");
    setResult(null);
    setLoading(true);

    let msgIdx = 0;
    setLoadingMsg(loadingMessages[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loadingMessages.length;
      setLoadingMsg(loadingMessages[msgIdx]);
    }, 1800);

    try {
      const visionPrompt = `
You are a legal expert AI assistant helping everyday people understand contracts and legal documents. Analyze the document in this file and respond ONLY with valid JSON (no markdown, no backticks, no explanation outside JSON).

Return this exact JSON structure:
{
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

      if (inputMode === "paste") {
        if (!pasteText.trim()) throw new Error("Please paste some document text.");
        const analysis = await analyzeDocumentWithGemini(pasteText);
        setResult(analysis);
      } else {
        if (!file) throw new Error("Please upload a photo or PDF first.");
        const { base64, mimeType } = await extractFileAsBase64(file);
        const body = {
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: base64 } },
              { text: visionPrompt }
            ]
          }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
        };
        const res = await fetch(GEMINI_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const e = await res.json();
          throw new Error(e?.error?.message || "Gemini vision analysis failed");
        }
        const data = await res.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const cleaned = raw.replace(/```json|```/g, "").trim();
        setResult(JSON.parse(cleaned));
      }
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const harmfulClauses = result?.clauses?.filter(c => c.isHarmful) || [];
  const safeClauses = result?.clauses?.filter(c => !c.isHarmful) || [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #f2f9f0; }

        .clause-page {
          min-height: 100vh;
          background: #f2f9f0;
          color: #1a3a1a;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Organic background pattern */
        .clause-page::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            radial-gradient(ellipse 80% 50% at 10% 20%, rgba(120,200,100,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 90% 80%, rgba(80,160,80,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(200,240,190,0.05) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .content-wrap { position: relative; z-index: 1; }

        .tab-btn {
          background: none; border: none; cursor: pointer;
          padding: 9px 20px;
          font-family: 'DM Mono', monospace;
          font-size: 12px; font-weight: 500;
          border-radius: 10px;
          transition: all 0.2s;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .tab-btn.active { background: #2d7a3a; color: #f0fdf0; }
        .tab-btn:not(.active) { color: #5a8a5a; }
        .tab-btn:hover:not(.active) { background: #e0f0dc; color: #2d7a3a; }

        .upload-zone {
          border: 2px dashed #a0c8a0;
          border-radius: 20px; padding: 48px 32px;
          text-align: center; cursor: pointer;
          transition: all 0.25s;
          background: rgba(255,255,255,0.5);
        }
        .upload-zone:hover, .upload-zone.drag {
          border-color: #3aad4f;
          background: rgba(220,250,215,0.5);
        }
        .upload-zone.has-file {
          border-color: #2d7a3a;
          background: rgba(210,245,210,0.5);
          border-style: solid;
        }

        .analyze-btn {
          background: linear-gradient(135deg, #2d7a3a 0%, #3aad4f 60%, #6aaa3a 100%);
          color: #f0fdf0;
          border: none; border-radius: 14px;
          padding: 16px 40px;
          font-family: 'DM Mono', monospace;
          font-size: 14px; font-weight: 500;
          cursor: pointer; letter-spacing: 0.06em;
          text-transform: uppercase;
          transition: all 0.25s; width: 100%;
          box-shadow: 0 4px 20px rgba(60,160,80,0.2);
        }
        .analyze-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(60,160,80,0.35);
        }
        .analyze-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .mode-btn {
          border: 1.5px solid #b8d8b8;
          background: rgba(255,255,255,0.6);
          border-radius: 10px; padding: 8px 20px;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .mode-btn.active {
          background: #2d7a3a; color: #f0fdf0; border-color: #2d7a3a;
        }
        .mode-btn:not(.active) { color: #5a8a5a; }
        .mode-btn:hover:not(.active) { background: #e8f5e4; border-color: #7aaa7a; }

        .sprout { animation: sprout 1.5s ease-in-out infinite alternate; }
        @keyframes sprout { from{opacity:0.4;transform:scale(0.92) rotate(-3deg)} to{opacity:0.9;transform:scale(1.04) rotate(3deg)} }

        .fade-in { animation: fadeIn 0.55s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

        textarea {
          background: rgba(255,255,255,0.8);
          border: 1.5px solid #b8d8b8;
          border-radius: 14px; color: #1a3a1a;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; padding: 16px;
          width: 100%; resize: vertical; outline: none; line-height: 1.7;
        }
        textarea:focus { border-color: #3aad4f; box-shadow: 0 0 0 3px rgba(58,173,79,0.1); }
        textarea::placeholder { color: #8aaa8a; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f0f7ee; }
        ::-webkit-scrollbar-thumb { background: #b0d0b0; border-radius: 3px; }

        .ground-strip {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 6px;
          background: linear-gradient(90deg, #2d7a3a, #4aaa3a, #6aaa1a, #3aad4f, #2d7a3a);
          background-size: 300% 100%;
          animation: shimmer 6s linear infinite;
        }
        @keyframes shimmer { 0%{background-position:0% 50%} 100%{background-position:300% 50%} }
      `}</style>

      <div className="clause-page">
        <div className="ground-strip" />

        {/* Decorative leaves */}
        <LeafDecor style={{ position: "fixed", top: 60, right: -10, width: 80, transform: "rotate(30deg)", pointerEvents: "none", zIndex: 0 }} />
        <LeafDecor style={{ position: "fixed", bottom: 80, left: -10, width: 60, transform: "rotate(-20deg) scaleX(-1)", pointerEvents: "none", zIndex: 0 }} />
        <LeafDecor style={{ position: "fixed", top: "40%", right: 20, width: 40, transform: "rotate(15deg)", pointerEvents: "none", zIndex: 0, opacity: 0.4 }} />

        <div className="content-wrap">
          {/* ── Header ── */}
          <header style={{ padding: "36px 24px 0", maxWidth: 860, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
              {/* Logo mark */}
              <div style={{ position: "relative", width: 52, height: 52 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: "linear-gradient(145deg, #e8f5e4, #c8e8c0)",
                  border: "1.5px solid #a0c8a0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, boxShadow: "0 4px 16px rgba(60,140,60,0.15)",
                }}>🌿</div>
              </div>
              <div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 30, letterSpacing: "-0.02em", color: "#1a3a1a", lineHeight: 1 }}>
                  Clause<span style={{ color: "#2d7a3a" }}>AI</span>
                </h1>
                <p style={{ color: "#7aaa7a", fontSize: 12, fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>Legal document scanner</p>
              </div>
            </div>

            {/* Organic divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0 12px" }}>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #b0d0b0, transparent)" }} />
              <span style={{ fontSize: 16 }}>🌱</span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #b0d0b0, transparent)" }} />
            </div>

            <p style={{ color: "#4a7a4a", fontSize: 15, lineHeight: 1.8, maxWidth: 580, fontWeight: 300 }}>
              Upload any contract, agreement, or legal document. We'll explain it in plain English and flag every clause that could harm you.
            </p>
          </header>

          <main style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 80px" }}>

            {/* ── Upload Card ── */}
            {!result && (
              <div style={{
                background: "rgba(255,255,255,0.75)",
                backdropFilter: "blur(12px)",
                borderRadius: 24, padding: 28,
                border: "1.5px solid #c8e4c4",
                marginBottom: 24,
                boxShadow: "0 4px 32px rgba(60,140,60,0.08)",
              }}>
                {/* Section title */}
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#7aaa7a", marginBottom: 18 }}>
                  — Upload Your Document
                </div>

                {/* Mode toggle */}
                <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                  <button className={`mode-btn ${inputMode === "upload" ? "active" : ""}`} onClick={() => setInputMode("upload")}>🖼 Photo / PDF</button>
                  <button className={`mode-btn ${inputMode === "paste" ? "active" : ""}`} onClick={() => setInputMode("paste")}>📋 Paste Text</button>
                </div>

                {inputMode === "upload" ? (
                  <div
                    className={`upload-zone ${dragOver ? "drag" : ""} ${file ? "has-file" : ""}`}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />
                    {file ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 40 }}>🌿</div>
                        <div style={{ color: "#2d7a3a", fontWeight: 700, fontFamily: "'Playfair Display', serif", fontSize: 16 }}>{file.name}</div>
                        <div style={{ color: "#8aaa8a", fontSize: 13, fontFamily: "'DM Mono', monospace" }}>{(file.size / 1024).toFixed(1)} KB · click to change</div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                        <div className="sprout" style={{ fontSize: 48 }}>🌱</div>
                        <div style={{ color: "#4a8a4a", fontWeight: 500, fontSize: 15 }}>
                          Drop your photo or PDF here, or <span style={{ color: "#2d7a3a", borderBottom: "1px solid #2d7a3a" }}>browse files</span>
                        </div>
                        <div style={{ color: "#8aaa8a", fontSize: 12, fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>JPG · PNG · WEBP · PDF</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea
                    rows={10}
                    placeholder="Paste your contract, agreement, terms of service, or any legal document text here..."
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                  />
                )}

                {error && (
                  <div style={{ marginTop: 16, color: "#b84a2e", fontSize: 14, padding: "12px 16px", background: "#fff5f0", borderRadius: 12, border: "1.5px solid #f0b09a" }}>
                    ⚠️ {error}
                  </div>
                )}

                <button
                  className="analyze-btn"
                  style={{ marginTop: 20 }}
                  disabled={loading || (inputMode === "upload" ? !file : !pasteText.trim())}
                  onClick={analyze}
                >
                  {loading ? "Analyzing…" : "🌿 Analyze Document"}
                </button>

                {loading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginTop: 18 }}>
                    <span style={{ fontSize: 18, animation: "sprout 1s ease-in-out infinite alternate" }}>🌱</span>
                    <span style={{ color: "#3aad4f", fontSize: 14, fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em" }}>{loadingMsg}</span>
                  </div>
                )}
              </div>
            )}

            {/* ── Results ── */}
            {result && (
              <div className="fade-in">
                {/* Summary bar */}
                <div style={{
                  background: "rgba(255,255,255,0.8)",
                  backdropFilter: "blur(12px)",
                  borderRadius: 24, padding: 28,
                  border: "1.5px solid #c8e4c4",
                  marginBottom: 20,
                  display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap",
                  boxShadow: "0 4px 32px rgba(60,140,60,0.08)",
                }}>
                  <ScoreRing score={result.riskScore} />
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 19, color: "#1a3a1a" }}>{result.documentType}</span>
                      <RiskBadge level={result.riskLabel} size="lg" />
                    </div>
                    <p style={{ color: "#4a7a4a", fontSize: 14, lineHeight: 1.85, fontWeight: 300 }}>{result.summary}</p>
                    <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                      {[
                        { val: harmfulClauses.length, label: "Harmful", color: "#b84a2e", bg: "#fff5f0", border: "#f0b09a" },
                        { val: safeClauses.length, label: "Safe", color: "#2d7a3a", bg: "#f0fdf4", border: "#a7d9b0" },
                        { val: result.clauses?.length || 0, label: "Total", color: "#3a6a1a", bg: "#f5faf0", border: "#c0d8a0" },
                      ].map(({ val, label, color, bg, border }) => (
                        <div key={label} style={{ textAlign: "center", background: bg, borderRadius: 12, padding: "8px 20px", border: `1.5px solid ${border}` }}>
                          <div style={{ color, fontWeight: 800, fontFamily: "'Playfair Display', serif", fontSize: 24 }}>{val}</div>
                          <div style={{ color: "#8aaa8a", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'DM Mono', monospace" }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => { setResult(null); setFile(null); setPasteText(""); }}
                    style={{
                      background: "#f0fdf4", border: "1.5px solid #a7d9b0", color: "#2d7a3a",
                      borderRadius: 10, padding: "8px 18px", cursor: "pointer",
                      fontSize: 12, fontFamily: "'DM Mono', monospace",
                      textTransform: "uppercase", letterSpacing: "0.05em",
                      transition: "all 0.2s",
                    }}>
                    ← New Doc
                  </button>
                </div>

                {/* Tabs */}
                <div style={{
                  display: "flex", gap: 4, marginBottom: 16,
                  background: "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 14, padding: 6,
                  border: "1.5px solid #c8e4c4",
                  flexWrap: "wrap",
                }}>
                  {["clauses", "rights", "redflags", "tips"].map(tab => (
                    <button key={tab} className={`tab-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                      {tab === "clauses" && `⚠ Clauses (${result.clauses?.length})`}
                      {tab === "rights" && `🛡 Your Rights`}
                      {tab === "redflags" && `🚩 Red Flags`}
                      {tab === "tips" && `💡 Negotiate`}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                {activeTab === "clauses" && (
                  <div>
                    {harmfulClauses.length > 0 && (
                      <>
                        <div style={{ color: "#b84a2e", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>⚠ Harmful Clauses</div>
                        {harmfulClauses.map((c, i) => <ClauseCard key={c.id} clause={c} index={i} />)}
                      </>
                    )}
                    {safeClauses.length > 0 && (
                      <>
                        <div style={{ color: "#2d7a3a", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.12em", margin: "20px 0 10px", fontFamily: "'DM Mono', monospace" }}>✓ Standard / Safe Clauses</div>
                        {safeClauses.map((c, i) => <ClauseCard key={c.id} clause={c} index={harmfulClauses.length + i} />)}
                      </>
                    )}
                  </div>
                )}

                {activeTab === "rights" && (
                  <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: 20, padding: 28, border: "1.5px solid #c8e4c4" }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, marginBottom: 6, color: "#1a3a1a", fontSize: 20 }}>🛡 Your Legal Rights</h3>
                    <p style={{ color: "#7aaa7a", fontSize: 13, marginBottom: 22, fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em" }}>Rights the document may not tell you about:</p>
                    {result.userRights?.map((right, i) => (
                      <div key={i} style={{ display: "flex", gap: 14, marginBottom: 14, alignItems: "flex-start" }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: "#eaf6f0", border: "1.5px solid #a0d0b0", color: "#2d7a3a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0, fontFamily: "'DM Mono', monospace" }}>{i + 1}</div>
                        <p style={{ color: "#2a5a3a", fontSize: 14, lineHeight: 1.8, paddingTop: 4 }}>{right}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "redflags" && (
                  <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: 20, padding: 28, border: "1.5px solid #c8e4c4" }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, marginBottom: 20, color: "#1a3a1a", fontSize: 20 }}>🚩 Major Red Flags</h3>
                    {result.redFlags?.map((flag, i) => (
                      <div key={i} style={{ background: "#fff5f0", border: "1.5px solid #f0b09a", borderRadius: 14, padding: "14px 18px", marginBottom: 12, color: "#8a3a1a", fontSize: 14, lineHeight: 1.8 }}>
                        🚩 {flag}
                      </div>
                    ))}
                    {(!result.redFlags || result.redFlags.length === 0) && (
                      <p style={{ color: "#2d7a3a", fontSize: 14, background: "#f0fdf4", borderRadius: 12, padding: "14px 18px", border: "1.5px solid #a7d9b0" }}>✓ No major red flags detected in this document.</p>
                    )}
                  </div>
                )}

                {activeTab === "tips" && (
                  <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: 20, padding: 28, border: "1.5px solid #c8e4c4" }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, marginBottom: 20, color: "#1a3a1a", fontSize: 20 }}>💡 How to Negotiate This Document</h3>
                    {result.negotiationTips?.map((tip, i) => (
                      <div key={i} style={{ display: "flex", gap: 14, marginBottom: 14, alignItems: "flex-start" }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: "#fffbeb", border: "1.5px solid #f5cc7a", color: "#92600a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>💡</div>
                        <p style={{ color: "#5a4a1a", fontSize: 14, lineHeight: 1.8, paddingTop: 4 }}>{tip}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: 36, textAlign: "center", color: "#a0c0a0", fontSize: 12, fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em" }}>
              🌿 ClauseAI uses Google Gemini to analyze documents. Not legal advice. Consult a qualified lawyer for important decisions.
            </div>
          </main>
        </div>
      </div>
    </>
  );
}