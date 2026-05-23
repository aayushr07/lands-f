"use client";

import { useState, useRef, useEffect } from "react";

// ─── DUMMY DATASET ──────────────────────────────────────────────────────────────
const LAND_DATABASE = {
  "MH-PN-2247-B": {
    id: "MH-PN-2247-B", owner: "Rajesh Kumar Sharma", area: "2.4 Acres",
    location: "Village Uruli Kanchan, Pune, Maharashtra",
    district: "Pune", state: "Maharashtra", type: "Agricultural",
    registeredOn: "14 March 2019", marketValue: "₹48,00,000",
    encumbrance: false, disputes: [], taxPaid: true, lastMutation: "2021",
    lat: 18.4682, lng: 74.0147, coordinates: "18.4682° N, 74.0147° E",
    titleStatus: "Clear", clause: "Freehold — no restrictions on transfer",
  },
  "KA-BG-1190-A": {
    id: "KA-BG-1190-A", owner: "Priya Nair", area: "0.8 Acres",
    location: "Whitefield Layout, Bengaluru, Karnataka",
    district: "Bengaluru Urban", state: "Karnataka", type: "Residential",
    registeredOn: "02 July 2021", marketValue: "₹1,20,00,000",
    encumbrance: true, disputes: ["Bank mortgage lien — HDFC Bank (active until 2031)"],
    taxPaid: true, lastMutation: "2021",
    lat: 12.9716, lng: 77.7143, coordinates: "12.9716° N, 77.7143° E",
    titleStatus: "Encumbered", clause: "Leasehold — 99-year lease from BDA",
  },
  "TN-CH-3345-C": {
    id: "TN-CH-3345-C", owner: "Mohammed Farooq", area: "1.2 Acres",
    location: "Tambaram East, Chennai, Tamil Nadu",
    district: "Chengalpattu", state: "Tamil Nadu", type: "Commercial",
    registeredOn: "19 January 2017", marketValue: "₹85,00,000",
    encumbrance: true,
    disputes: [
      "Boundary dispute with adjacent plot TN-CH-3344-C (court case pending — Madras HC)",
      "Tax arrears: ₹1,24,000 unpaid since 2020",
    ],
    taxPaid: false, lastMutation: "2017",
    lat: 12.9249, lng: 80.1000, coordinates: "12.9249° N, 80.1000° E",
    titleStatus: "Disputed", clause: "Freehold — disputed boundary on eastern side",
  },
  "DL-SD-0091-D": {
    id: "DL-SD-0091-D", owner: "Ananya Singh", area: "500 sq. yards",
    location: "Saket, South Delhi", district: "South Delhi", state: "Delhi",
    type: "Residential", registeredOn: "30 November 2022", marketValue: "₹3,50,00,000",
    encumbrance: false, disputes: [], taxPaid: true, lastMutation: "2022",
    lat: 28.5244, lng: 77.2066, coordinates: "28.5244° N, 77.2066° E",
    titleStatus: "Clear", clause: "Freehold — GPA registered, title clear",
  },
};

// ─── REAL OCR VIA CLAUDE VISION ─────────────────────────────────────────────────
async function extractDocumentWithVision(base64Data, mediaType) {
  const prompt = `You are a land document OCR system. Carefully read this land/property document image and extract every piece of information you can find.

Return ONLY a valid JSON object with these exact keys (use null for fields not found):
{
  "owner": "full owner/buyer name as written",
  "surveyId": "survey number, plot number, or land ID (e.g. MH-PN-2247-B format if present)",
  "area": "land area with unit (e.g. 2.4 Acres, 500 sq yards)",
  "location": "full address or village/district/state",
  "district": "district name",
  "state": "state name",
  "landType": "Agricultural / Residential / Commercial / Industrial",
  "registrationDate": "date of registration or execution",
  "consideration": "sale price or market value if mentioned",
  "clause": "any title clause or restriction mentioned (freehold/leasehold etc)",
  "documentType": "type of document (Sale Deed / Mutation / EC / Patta etc)",
  "rawText": "all readable text from the document concatenated"
}

IMPORTANT: Extract EXACTLY what is written. Do not invent data. If a field is not visible or readable, use null.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64Data },
          },
          { type: "text", text: prompt },
        ],
      }],
    }),
  });

  if (!response.ok) throw new Error(`API error ${response.status}`);
  const data = await response.json();
  const text = data.content.map(b => b.text || "").join("");

  // Strip markdown fences if present
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// Convert File to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── LEAFLET MAP ────────────────────────────────────────────────────────────────
function LandMap({ lat, lng, owner, landId, titleStatus }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const color = titleStatus === "Clear" ? "#16a34a" : titleStatus === "Disputed" ? "#dc2626" : "#d97706";

  useEffect(() => {
    if (instanceRef.current || !mapRef.current) return;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView([lat, lng], 14);
      instanceRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>', maxZoom: 19,
      }).addTo(map);
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:40px;height:50px"><svg viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg" style="width:40px;height:50px;filter:drop-shadow(0 3px 8px rgba(0,0,0,.2))"><path d="M20 1C10.6 1 3 8.6 3 18c0 13 17 31 17 31S37 31 37 18C37 8.6 29.4 1 20 1z" fill="${color}"/><circle cx="20" cy="18" r="8" fill="white" opacity=".95"/><circle cx="20" cy="18" r="4.5" fill="${color}"/></svg></div>`,
        iconSize: [40, 50], iconAnchor: [20, 50], popupAnchor: [0, -52],
      });
      L.marker([lat, lng], { icon }).addTo(map)
        .bindPopup(`<div style="font-family:'DM Sans',sans-serif;padding:2px"><b style="font-size:13px;color:#111">${owner}</b><br><span style="font-size:11px;color:#888;font-family:monospace">${landId}</span><br><span style="font-size:11px;color:${color};font-weight:700">${titleStatus}</span></div>`, { maxWidth: 180 })
        .openPopup();
      L.circle([lat, lng], { radius: 200, color, fillColor: color, fillOpacity: 0.07, weight: 1.5, dashArray: "5,4" }).addTo(map);
    })();
    return () => { if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null; } };
  }, [lat, lng]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}

// ─── MAP MODAL ──────────────────────────────────────────────────────────────────
function MapModal({ land, onClose }) {
  const color   = land.titleStatus === "Clear" ? "#16a34a" : land.titleStatus === "Disputed" ? "#dc2626" : "#d97706";
  const colorBg = land.titleStatus === "Clear" ? "#f0fdf4"  : land.titleStatus === "Disputed" ? "#fef2f2"  : "#fffbeb";
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const esc = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", esc); };
  }, [onClose]);
  return (
    <div className="mo" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mb">
        <div className="mh">
          <div>
            <div className="mt2">Land Location</div>
            <div className="ms">{land.location}</div>
          </div>
          <button className="mc" onClick={onClose}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" style={{width:15,height:15}}><path strokeLinecap="round" d="M5 5l10 10M15 5 5 15"/></svg>
          </button>
        </div>
        <div className="mmw"><LandMap lat={land.lat} lng={land.lng} owner={land.owner} landId={land.id} titleStatus={land.titleStatus} /></div>
        <div className="mf">
          <div className="mmeta">
            {[["Coordinates", land.coordinates], ["Owner", land.owner], ["Area", land.area]].map(([k,v]) => (
              <div key={k} className="mmeta-i"><span className="mmeta-k">{k}</span><span className="mmeta-v">{v}</span></div>
            ))}
            <div className="mmeta-i">
              <span className="mmeta-k">Title</span>
              <span className="mmeta-v" style={{color, background:colorBg, padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700, border:`1px solid ${color}25`}}>{land.titleStatus}</span>
            </div>
          </div>
          <a href={`https://www.openstreetmap.org/?mlat=${land.lat}&mlon=${land.lng}&zoom=15`} target="_blank" rel="noopener noreferrer" className="btn-osm">
            Open in OpenStreetMap
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" style={{width:11,height:11}}><path strokeLinecap="round" d="m6 3 5 5-5 5"/></svg>
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── EXTRACTED INFO PANEL (shown before verify) ────────────────────────────────
function ExtractedPanel({ data, onVerify, onRetry }) {
  const fields = [
    ["Document Type",      data.documentType],
    ["Owner / Buyer",      data.owner],
    ["Survey / Land ID",   data.surveyId],
    ["Area",               data.area],
    ["Location",           data.location],
    ["District",           data.district],
    ["State",              data.state],
    ["Land Type",          data.landType],
    ["Registration Date",  data.registrationDate],
    ["Consideration",      data.consideration],
    ["Title Clause",       data.clause],
  ].filter(([, v]) => v && v !== "null");

  return (
    <div className="ep">
      <div className="ep-head">
        <div className="ep-title-row">
          <div className="ep-icon">
            <svg viewBox="0 0 20 20" fill="none" stroke="#16a34a" strokeWidth="1.8" style={{width:18,height:18}}><path strokeLinecap="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
          </div>
          <div>
            <div className="ep-title">Document Scanned</div>
            <div className="ep-sub">Review extracted details before verifying against records</div>
          </div>
        </div>
      </div>

      <div className="ep-grid">
        {fields.map(([k, v]) => (
          <div key={k} className="ep-field">
            <div className="ep-fl">{k}</div>
            <div className="ep-fv">{v}</div>
          </div>
        ))}
      </div>

      {data.rawText && (
        <details className="ep-raw">
          <summary className="ep-raw-toggle">View all extracted text</summary>
          <div className="ep-raw-box">{data.rawText}</div>
        </details>
      )}

      <div className="ep-notice">
        <svg viewBox="0 0 20 20" fill="none" stroke="#d97706" strokeWidth="1.7" style={{width:14,height:14,flexShrink:0,marginTop:1}}><path strokeLinecap="round" d="M10 2 1.5 17h17L10 2Zm0 6v4m0 2.5v.5"/></svg>
        <span>Fields not found in the document are shown as blank. Check the extracted info then click Verify to cross-check against the land registry.</span>
      </div>

      <div className="ep-actions">
        {data.surveyId ? (
          <button className="btn-sub" onClick={() => onVerify(data.surveyId, data)}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:15,height:15}}><path strokeLinecap="round" d="m17 17-3.9-3.9m0 0A6.5 6.5 0 1 0 4.6 4.6a6.5 6.5 0 0 0 8.5 8.5Z"/></svg>
            Verify Against Registry
          </button>
        ) : (
          <div style={{display:"flex",gap:10,flexDirection:"column"}}>
            <div className="ep-no-id">
              <svg viewBox="0 0 20 20" fill="none" stroke="#dc2626" strokeWidth="1.8" style={{width:14,height:14,flexShrink:0}}><path strokeLinecap="round" d="M10 2 1.5 17h17L10 2Zm0 6v4m0 2.5v.5"/></svg>
              No Land ID found in document. Enter it manually below to verify against registry.
            </div>
            <ManualIdEntry onVerify={(id) => onVerify(id, data)} />
          </div>
        )}
        <button className="btn-ghost" onClick={onRetry}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:13,height:13}}><path strokeLinecap="round" d="M4 4v5h5M16 16v-5h-5"/><path strokeLinecap="round" d="M4.93 9A8 8 0 1 1 16 15.07"/></svg>
          Scan Different Document
        </button>
      </div>
    </div>
  );
}

function ManualIdEntry({ onVerify }) {
  const [id, setId] = useState("");
  return (
    <div style={{display:"flex",gap:8}}>
      <input className="id-in" style={{margin:0,flex:1}} placeholder="Enter Land ID manually, e.g. MH-PN-2247-B"
        value={id} onChange={e => setId(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === "Enter" && id.trim() && onVerify(id.trim())} />
      <button className="btn-sub" style={{width:"auto",padding:"12px 20px"}} onClick={() => id.trim() && onVerify(id.trim())}>Verify</button>
    </div>
  );
}

// ─── RESULT CARD ────────────────────────────────────────────────────────────────
function ResultCard({ land, extracted, onMap }) {
  const [showRaw, setShowRaw] = useState(false);
  const isClear    = land.disputes.length === 0 && !land.encumbrance && land.taxPaid;
  const isDisputed = land.disputes.length > 0;
  const color      = isClear ? "#16a34a" : isDisputed ? "#dc2626" : "#d97706";
  const colorBg    = isClear ? "#f0fdf4"  : isDisputed ? "#fef2f2"  : "#fffbeb";
  const statusLabel = isClear ? "Clear Title" : isDisputed ? "Disputed" : "Encumbered";

  const fields = [
    ["Land ID", land.id], ["Owner Name", land.owner], ["Area", land.area],
    ["Land Type", land.type], ["Location", land.location], ["State", land.state],
    ["Registered On", land.registeredOn], ["Market Value", land.marketValue],
    ["Last Mutation", land.lastMutation], ["Coordinates", land.coordinates],
    ["Clause", land.clause],
  ];
  const checks = [
    { label: "Title Status",    ok: land.titleStatus === "Clear", val: land.titleStatus },
    { label: "Encumbrance",     ok: !land.encumbrance,            val: land.encumbrance ? "Found" : "None" },
    { label: "Tax Payment",     ok: land.taxPaid,                 val: land.taxPaid ? "Up to date" : "Arrears pending" },
    { label: "Active Disputes", ok: !isDisputed,                  val: isDisputed ? `${land.disputes.length} found` : "None" },
  ];

  // Match OCR vs registry
  const matchRows = extracted ? [
    { label: "Owner",   ext: extracted.owner,    db: land.owner },
    { label: "Land ID", ext: extracted.surveyId, db: land.id },
    { label: "Area",    ext: extracted.area,      db: land.area },
  ].filter(m => m.ext) : [];

  return (
    <div className="rc">
      <div className="rc-banner" style={{ background: colorBg, borderColor: color + "28" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:color, flexShrink:0 }} />
          <div>
            <div style={{ fontFamily:"var(--fh)", fontSize:16, fontWeight:700, color }}>{statusLabel}</div>
            <div style={{ fontSize:12.5, color:"var(--muted)", marginTop:2, fontFamily:"var(--fm)" }}>{land.id} · {land.owner}</div>
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"var(--fh)", fontSize:11, fontWeight:600, color:"var(--muted2)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:3 }}>Registry Match</div>
          <span style={{ padding:"4px 12px", borderRadius:20, background:colorBg, color, border:`1px solid ${color}35`, fontSize:12, fontWeight:700 }}>Verified</span>
        </div>
      </div>

      <div className="rc-act-row">
        <button className="btn-map" onClick={onMap}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14}}><path strokeLinecap="round" strokeLinejoin="round" d="M10 2a6 6 0 0 1 6 6c0 5-6 11-6 11S4 13 4 8a6 6 0 0 1 6-6Z"/><circle cx="10" cy="8" r="2"/></svg>
          View on Map
        </button>
        <button className="btn-outline" onClick={() => alert("Download coming soon!")}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:13,height:13}}><path strokeLinecap="round" d="M10 3v10m0 0-3.5-3.5M10 13l3.5-3.5M3 16.5h14"/></svg>
          Download Report
        </button>
        <button className="btn-ghost" onClick={() => window.location.reload()}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:13,height:13}}><path strokeLinecap="round" d="M4 4v5h5M16 16v-5h-5"/><path strokeLinecap="round" d="M4.93 9A8 8 0 1 1 16 15.07"/></svg>
          Verify Another
        </button>
      </div>

      <div className="rc-sec-title">Land Details</div>
      <div className="rc-grid">
        {fields.map(([k, v]) => (
          <div key={k} className="rc-field">
            <div className="rc-fl">{k}</div>
            <div className="rc-fv">{v}</div>
          </div>
        ))}
      </div>

      <div className="rc-sec-title" style={{ marginTop:20 }}>Verification Checks</div>
      <div className="rc-checks">
        {checks.map(c => (
          <div key={c.label} className={`rc-check ${c.ok ? "ok" : "fail"}`}>
            <div className="rc-ci" style={{ background: c.ok ? "#dcfce7" : "#fee2e2", color: c.ok ? "#16a34a" : "#dc2626" }}>
              {c.ok
                ? <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:12,height:12}}><path strokeLinecap="round" d="m3.5 10 5 5 8-9"/></svg>
                : <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:12,height:12}}><path strokeLinecap="round" d="M4 4l12 12M16 4 4 16"/></svg>}
            </div>
            <span className="rc-cl">{c.label}</span>
            <span className="rc-cv" style={{ color: c.ok ? "#16a34a" : "#dc2626" }}>{c.val}</span>
          </div>
        ))}
      </div>

      {land.disputes.length > 0 && (
        <>
          <div className="rc-sec-title" style={{ marginTop:20, color:"#dc2626" }}>Active Disputes</div>
          {land.disputes.map((d, i) => (
            <div key={i} className="rc-dispute">
              <svg viewBox="0 0 20 20" fill="none" stroke="#dc2626" strokeWidth="1.8" style={{width:14,height:14,flexShrink:0,marginTop:1}}><path strokeLinecap="round" d="M10 2 1.5 17h17L10 2Zm0 6v4m0 2.5v.5"/></svg>
              <span>{d}</span>
            </div>
          ))}
        </>
      )}

      {matchRows.length > 0 && (
        <>
          <div className="rc-sec-title" style={{ marginTop:20 }}>Document vs Registry Match</div>
          <div className="rc-match-wrap">
            {matchRows.map(m => {
              const ok = m.ext?.toLowerCase().trim() === m.db?.toLowerCase().trim();
              return (
                <div key={m.label} className={`rc-match-row ${ok ? "ok" : "warn"}`}>
                  <span className="rc-ml">{m.label}</span>
                  <span className="rc-me">{m.ext}</span>
                  <div style={{ color: ok ? "#16a34a" : "#d97706", display:"flex", justifyContent:"center" }}>
                    {ok
                      ? <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:12,height:12}}><path strokeLinecap="round" d="m3.5 10 5 5 8-9"/></svg>
                      : <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:12,height:12}}><path strokeLinecap="round" d="M4 4l12 12M16 4 4 16"/></svg>}
                  </div>
                  <span className="rc-md">{m.db}</span>
                </div>
              );
            })}
          </div>
          {extracted?.rawText && (
            <>
              <button className="raw-btn" onClick={() => setShowRaw(v => !v)}>{showRaw ? "Hide" : "Show"} raw extracted text</button>
              {showRaw && <div className="raw-box">{extracted.rawText}</div>}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────────
export default function VerifyPage() {
  // "id" | "upload"
  const [mode, setMode]         = useState("id");
  const [landId, setLandId]     = useState("");
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);

  // flow states: "idle" | "scanning" | "extracted" | "verifying" | "done" | "error"
  const [phase, setPhase]       = useState("idle");
  const [scanStep, setScanStep] = useState("");
  const [extracted, setExtracted] = useState(null);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState("");
  const [mapOpen, setMapOpen]   = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const handleFile = f => {
    if (!f) return;
    // Validate type
    if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
      setError("Please upload an image (JPG, PNG) or PDF file."); return;
    }
    setFile(f); setPreview(URL.createObjectURL(f)); setError("");
  };

  // REAL OCR — reads document via Claude Vision
  const runScan = async () => {
    if (!file) { setError("Please upload a document first."); return; }
    setError(""); setPhase("scanning");

    try {
      setScanStep("Reading document pixels…");
      await new Promise(r => setTimeout(r, 400));

      const base64 = await fileToBase64(file);
      const mediaType = file.type.startsWith("image/") ? file.type : "image/jpeg";

      setScanStep("Identifying text regions…");
      await new Promise(r => setTimeout(r, 300));

      setScanStep("Extracting fields from document…");
      const data = await extractDocumentWithVision(base64, mediaType);

      setExtracted(data);
      setPhase("extracted");
    } catch (err) {
      console.error(err);
      setError("Could not read the document. Make sure the image is clear and try again.");
      setPhase("idle");
    }
  };

  // Cross-check extracted (or manual) ID against registry
  const runVerify = async (id, ext) => {
    setError(""); setPhase("verifying");
    const steps = ["Querying land registry…", "Checking encumbrances…", "Checking dispute records…", "Generating report…"];
    for (const s of steps) { setScanStep(s); await new Promise(r => setTimeout(r, 650)); }
    const land = LAND_DATABASE[id?.toUpperCase()];
    if (!land) {
      setError(`No registry record found for "${id}". The document details were extracted correctly but this ID is not in the current database. Try: MH-PN-2247-B · KA-BG-1190-A · TN-CH-3345-C · DL-SD-0091-D`);
      setPhase("idle"); return;
    }
    setResult({ land });
    setPhase("done");
  };

  const handleIdSubmit = () => {
    if (!landId.trim()) { setError("Please enter a Land ID."); return; }
    setError(""); runVerify(landId.trim(), null);
  };

  const reset = () => {
    setPhase("idle"); setFile(null); setPreview(null);
    setExtracted(null); setResult(null); setError(""); setLandId("");
  };

  const isLoading = phase === "scanning" || phase === "verifying";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:#f5f6f8; --white:#fff; --border:#e4e7ed; --border2:#d0d4de;
          --text:#111827; --muted:#6b7280; --muted2:#9ca3af;
          --accent:#16a34a; --accent-lt:#f0fdf4; --accent-bd:#bbf7d0;
          --fh:'Syne',sans-serif; --fb:'DM Sans',sans-serif; --fm:'JetBrains Mono',monospace;
          --r:14px; --sh:0 1px 4px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);
        }
        body { background:var(--bg); color:var(--text); font-family:var(--fb); -webkit-font-smoothing:antialiased; }
        .vp { min-height:100vh; padding:90px 20px 72px; }
        .vp-inner { max-width:740px; margin:0 auto; }

        /* HEADER */
        .vp-head { margin-bottom:32px; animation:up .4s ease both; }
        .vp-pill { display:inline-flex; align-items:center; gap:7px; background:var(--accent-lt); border:1px solid var(--accent-bd); color:var(--accent); padding:5px 14px; border-radius:100px; font-size:11px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; margin-bottom:16px; }
        .p-dot { width:6px; height:6px; border-radius:50%; background:var(--accent); animation:pulse 2s infinite; }
        .vp-title { font-family:var(--fh); font-size:clamp(28px,4.5vw,44px); font-weight:800; letter-spacing:-.03em; color:var(--text); margin-bottom:10px; }
        .vp-sub { font-size:15px; color:var(--muted); line-height:1.65; max-width:520px; }

        @keyframes up   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse{ 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes grow { 0%{width:0%} 65%{width:100%} 100%{width:100%} }
        @keyframes scan { 0%{top:0%} 100%{top:93%} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }

        /* CARD */
        .card { background:var(--white); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--sh); overflow:hidden; animation:up .4s ease both; }
        .cp { padding:24px; }

        /* MODE TABS — only 2 */
        .tabs { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:24px; }
        .tab { display:flex; flex-direction:column; align-items:center; gap:6px; padding:18px 12px; border-radius:12px; border:1.5px solid var(--border); background:var(--bg); color:var(--muted); cursor:pointer; transition:all .16s; font-family:var(--fb); }
        .tab:hover { border-color:var(--border2); color:var(--text); background:var(--white); }
        .tab.on { border-color:var(--accent); color:var(--accent); background:var(--accent-lt); box-shadow:0 0 0 3px rgba(22,163,74,.07); }
        .tab-ico { width:36px; height:36px; border-radius:10px; background:rgba(0,0,0,.05); display:flex; align-items:center; justify-content:center; }
        .tab.on .tab-ico { background:rgba(22,163,74,.13); }
        .tab-name { font-size:14px; font-weight:700; }
        .tab-hint { font-size:11.5px; color:var(--muted2); text-align:center; }

        /* CHIPS */
        .chips { display:flex; flex-wrap:wrap; gap:7px; margin-bottom:18px; }
        .chips-lbl { font-size:11.5px; color:var(--muted); font-weight:500; width:100%; }
        .chip { padding:4px 13px; border-radius:7px; border:1px solid var(--border); background:var(--bg); font-size:12px; font-family:var(--fm); color:var(--muted); cursor:pointer; transition:all .15s; font-weight:500; }
        .chip:hover { border-color:var(--accent); color:var(--accent); background:var(--accent-lt); }

        /* INPUT */
        .fl { font-size:11.5px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.07em; margin-bottom:7px; }
        .id-in { width:100%; padding:13px 16px; border-radius:10px; border:1.5px solid var(--border); background:var(--bg); font-family:var(--fm); font-size:15px; font-weight:500; color:var(--text); outline:none; transition:border .16s,box-shadow .16s; margin-bottom:18px; }
        .id-in::placeholder { color:var(--muted2); font-family:var(--fb); font-weight:400; }
        .id-in:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(22,163,74,.1); background:var(--white); }

        /* DROP */
        .drop { border:2px dashed var(--border2); border-radius:12px; padding:44px 20px; text-align:center; cursor:pointer; transition:all .2s; background:var(--bg); }
        .drop.over { border-color:var(--accent); background:var(--accent-lt); }
        .drop:hover { border-color:#adb5c4; background:var(--white); }
        .d-ico { color:var(--muted2); display:flex; justify-content:center; margin-bottom:14px; }
        .drop.over .d-ico { color:var(--accent); }
        .d-title { font-family:var(--fh); font-size:17px; font-weight:700; color:var(--text); margin-bottom:6px; }
        .d-sub { font-size:13px; color:var(--muted); margin-bottom:18px; line-height:1.6; }
        .btn-br { display:inline-flex; align-items:center; gap:6px; padding:9px 20px; border-radius:9px; border:1.5px solid var(--border2); background:var(--white); color:var(--text); font-size:13px; font-weight:600; cursor:pointer; transition:all .15s; font-family:var(--fb); }
        .btn-br:hover { border-color:var(--accent); color:var(--accent); }

        /* FILE PREVIEW */
        .fp { display:flex; align-items:center; gap:13px; padding:13px; background:var(--bg); border:1.5px solid var(--border); border-radius:11px; margin-bottom:14px; }
        .fp-thumb { width:48px; height:48px; border-radius:8px; flex-shrink:0; display:flex; align-items:center; justify-content:center; color:var(--muted); background:var(--border); overflow:hidden; }
        .fp-thumb img { width:100%; height:100%; object-fit:cover; }
        .fp-name { font-size:13.5px; font-weight:600; color:var(--text); }
        .fp-sz { font-size:12px; color:var(--muted); margin-top:2px; }
        .fp-rm { margin-left:auto; padding:7px; border-radius:7px; background:#fee2e2; border:none; color:#dc2626; cursor:pointer; display:flex; }

        /* SCAN PREVIEW */
        .scan-wrap { position:relative; border-radius:10px; overflow:hidden; margin-bottom:14px; border:1px solid var(--border); }
        .scan-img { width:100%; max-height:220px; object-fit:contain; display:block; background:var(--bg); }
        .scan-over { position:absolute; inset:0; background:rgba(255,255,255,.6); display:flex; align-items:center; justify-content:center; }
        .scan-line { position:absolute; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,var(--accent),transparent); animation:scan 1.8s ease-in-out infinite; }
        .scan-badge { display:flex; align-items:center; gap:6px; background:var(--white); border:1px solid var(--accent-bd); color:var(--accent); padding:8px 16px; border-radius:100px; font-size:12.5px; font-weight:700; box-shadow:var(--sh); }

        /* ERR */
        .err { background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:12px 16px; color:#dc2626; font-size:13px; display:flex; gap:9px; align-items:flex-start; margin-bottom:16px; line-height:1.5; }
        .divider { height:1px; background:var(--border); margin:16px 0; }

        /* SUBMIT */
        .btn-sub { width:100%; padding:14px; border-radius:11px; background:var(--accent); color:#fff; font-family:var(--fh); font-size:15px; font-weight:700; border:none; cursor:pointer; transition:all .18s; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 3px 12px rgba(22,163,74,.22); }
        .btn-sub:hover { background:#15803d; transform:translateY(-1px); }

        /* PROCESSING */
        .proc { background:var(--white); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--sh); padding:56px 24px; text-align:center; animation:up .4s ease both; }
        .proc-ring { width:48px; height:48px; border-radius:50%; border:2.5px solid var(--border2); border-top-color:var(--accent); animation:spin .7s linear infinite; margin:0 auto 20px; }
        .proc-title { font-family:var(--fh); font-size:19px; font-weight:700; color:var(--text); margin-bottom:8px; }
        .proc-phase { font-size:12.5px; color:var(--accent); font-family:var(--fm); background:var(--accent-lt); border:1px solid var(--accent-bd); padding:6px 16px; border-radius:8px; display:inline-block; margin-bottom:28px; }
        .proc-rows { display:flex; flex-direction:column; gap:10px; max-width:300px; margin:0 auto; }
        .proc-row { display:flex; align-items:center; gap:10px; }
        .proc-dot { width:7px; height:7px; border-radius:50%; background:var(--accent); flex-shrink:0; }
        .proc-lbl { font-size:12.5px; color:var(--muted); flex:1; text-align:left; }
        .proc-bar { width:80px; height:4px; background:var(--border); border-radius:4px; overflow:hidden; }
        .proc-fill { height:100%; background:var(--accent); border-radius:4px; animation:grow 2s ease infinite; }

        /* EXTRACTED PANEL */
        .ep { background:var(--white); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--sh); overflow:hidden; animation:up .4s ease both; }
        .ep-head { padding:20px 24px; border-bottom:1px solid var(--border); background:var(--accent-lt); }
        .ep-title-row { display:flex; align-items:flex-start; gap:12px; }
        .ep-icon { width:36px; height:36px; border-radius:10px; background:rgba(22,163,74,.12); display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
        .ep-title { font-family:var(--fh); font-size:16px; font-weight:700; color:var(--text); margin-bottom:3px; }
        .ep-sub { font-size:13px; color:var(--muted); }
        .ep-grid { display:grid; grid-template-columns:repeat(2,1fr); }
        @media(max-width:540px){ .ep-grid{grid-template-columns:1fr} .ep-field:nth-child(even){border-left:none} }
        .ep-field { padding:11px 24px; border-top:1px solid var(--border); }
        .ep-field:nth-child(even) { border-left:1px solid var(--border); }
        .ep-fl { font-size:10px; text-transform:uppercase; letter-spacing:.07em; color:var(--muted2); font-weight:600; margin-bottom:3px; }
        .ep-fv { font-size:13.5px; color:var(--text); font-weight:500; line-height:1.4; }
        .ep-raw { margin:0 24px; border:1px solid var(--border); border-radius:10px; overflow:hidden; }
        .ep-raw-toggle { padding:10px 14px; font-size:12.5px; color:var(--muted); cursor:pointer; list-style:none; user-select:none; background:var(--bg); display:flex; align-items:center; gap:6px; }
        .ep-raw-toggle:hover { color:var(--text); }
        .ep-raw-box { padding:14px; font-family:var(--fm); font-size:12px; color:var(--muted); line-height:1.7; white-space:pre-wrap; border-top:1px solid var(--border); background:var(--white); }
        .ep-notice { display:flex; gap:8px; align-items:flex-start; margin:16px 24px 0; padding:11px 14px; background:#fffbeb; border:1px solid #fde68a; border-radius:10px; font-size:12.5px; color:#92400e; line-height:1.55; }
        .ep-no-id { display:flex; gap:8px; align-items:flex-start; padding:11px 14px; background:#fef2f2; border:1px solid #fecaca; border-radius:10px; font-size:13px; color:#991b1b; }
        .ep-actions { display:flex; flex-direction:column; gap:10px; padding:20px 24px; }

        /* RESULT */
        .rc { background:var(--white); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--sh); overflow:hidden; animation:up .45s ease both; }
        .rc-banner { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; padding:20px 24px; border-bottom:1px solid var(--border); }
        .rc-act-row { display:flex; gap:8px; flex-wrap:wrap; padding:14px 24px; border-bottom:1px solid var(--border); background:var(--bg); }
        .btn-map { display:inline-flex; align-items:center; gap:7px; padding:9px 18px; border-radius:9px; background:var(--accent); color:#fff; font-family:var(--fh); font-size:13.5px; font-weight:700; border:none; cursor:pointer; transition:all .16s; box-shadow:0 2px 8px rgba(22,163,74,.2); }
        .btn-map:hover { background:#15803d; transform:translateY(-1px); }
        .btn-outline { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border-radius:9px; background:var(--white); border:1.5px solid var(--border2); color:var(--text); font-family:var(--fb); font-size:13px; font-weight:600; cursor:pointer; transition:all .16s; }
        .btn-outline:hover { border-color:var(--accent); color:var(--accent); }
        .btn-ghost { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border-radius:9px; background:transparent; border:1.5px solid var(--border); color:var(--muted); font-family:var(--fb); font-size:13px; font-weight:600; cursor:pointer; transition:all .16s; }
        .btn-ghost:hover { border-color:var(--border2); color:var(--text); }

        .rc-sec-title { font-size:10.5px; text-transform:uppercase; letter-spacing:.1em; font-weight:700; color:var(--muted2); padding:18px 24px 10px; }
        .rc-grid { display:grid; grid-template-columns:repeat(2,1fr); }
        @media(max-width:540px){ .rc-grid{grid-template-columns:1fr} .rc-field:nth-child(even){border-left:none} }
        .rc-field { padding:11px 24px; border-top:1px solid var(--border); }
        .rc-field:nth-child(even) { border-left:1px solid var(--border); }
        .rc-fl { font-size:10px; text-transform:uppercase; letter-spacing:.07em; color:var(--muted2); font-weight:600; margin-bottom:3px; }
        .rc-fv { font-size:13.5px; color:var(--text); font-weight:500; line-height:1.4; }

        .rc-checks { display:flex; flex-direction:column; gap:7px; padding:0 24px; }
        .rc-check { display:flex; align-items:center; gap:11px; padding:10px 14px; border-radius:10px; border:1px solid var(--border); background:var(--bg); }
        .rc-ci { width:24px; height:24px; border-radius:7px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .rc-cl { font-size:13.5px; font-weight:500; color:var(--text); flex:1; }
        .rc-cv { font-size:12px; font-weight:600; font-family:var(--fm); }

        .rc-dispute { display:flex; align-items:flex-start; gap:9px; padding:11px 14px; border-radius:10px; background:#fef2f2; border:1px solid #fecaca; color:#991b1b; font-size:13px; line-height:1.5; margin:0 24px 8px; }

        .rc-match-wrap { display:flex; flex-direction:column; gap:7px; padding:0 24px; }
        .rc-match-row { display:grid; grid-template-columns:55px 1fr 22px 1fr; align-items:center; gap:10px; padding:10px 14px; border-radius:10px; background:var(--bg); border:1px solid var(--border); }
        .rc-match-row.ok { border-color:var(--accent-bd); }
        .rc-match-row.warn { border-color:#fde68a; background:#fffbeb; }
        .rc-ml { font-size:10.5px; text-transform:uppercase; letter-spacing:.07em; font-weight:700; color:var(--muted2); }
        .rc-me { font-family:var(--fm); font-size:12px; color:var(--text); }
        .rc-md { font-family:var(--fm); font-size:12px; color:var(--muted); }

        .raw-btn { display:block; margin:14px 24px 0; padding:7px 16px; border-radius:8px; border:1px solid var(--border); background:transparent; font-size:12.5px; color:var(--muted); cursor:pointer; font-family:var(--fb); transition:all .15s; }
        .raw-btn:hover { border-color:var(--border2); color:var(--text); }
        .raw-box { margin:10px 24px 24px; padding:16px; background:var(--bg); border:1px solid var(--border); border-radius:10px; font-family:var(--fm); font-size:12px; color:var(--muted); line-height:1.7; white-space:pre-wrap; }

        /* MAP MODAL */
        .mo { position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,.4); backdrop-filter:blur(5px); display:flex; align-items:center; justify-content:center; padding:20px; animation:fadeIn .22s ease; }
        .mb { background:var(--white); border-radius:20px; width:100%; max-width:680px; box-shadow:0 24px 60px rgba(0,0,0,.18); overflow:hidden; display:flex; flex-direction:column; max-height:90vh; }
        .mh { display:flex; align-items:flex-start; justify-content:space-between; padding:20px 22px; border-bottom:1px solid var(--border); }
        .mt2 { font-family:var(--fh); font-size:17px; font-weight:700; color:var(--text); }
        .ms { font-size:13px; color:var(--muted); margin-top:3px; }
        .mc { width:32px; height:32px; border-radius:8px; border:1px solid var(--border); background:var(--bg); cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--muted); transition:all .14s; flex-shrink:0; }
        .mc:hover { background:#fee2e2; border-color:#fecaca; color:#dc2626; }
        .mmw { height:340px; flex-shrink:0; }
        .mf { padding:16px 22px; border-top:1px solid var(--border); background:var(--bg); }
        .mmeta { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:14px; }
        @media(max-width:520px){ .mmeta{grid-template-columns:repeat(2,1fr)} }
        .mmeta-i { display:flex; flex-direction:column; gap:3px; }
        .mmeta-k { font-size:10px; text-transform:uppercase; letter-spacing:.08em; color:var(--muted2); font-weight:600; }
        .mmeta-v { font-size:13px; font-weight:600; color:var(--text); font-family:var(--fm); }
        .btn-osm { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:9px; border:1.5px solid var(--border2); background:var(--white); font-size:13px; font-weight:600; color:var(--text); text-decoration:none; transition:all .15s; font-family:var(--fb); }
        .btn-osm:hover { border-color:var(--accent); color:var(--accent); }

        @media(max-width:480px){ .rc-act-row{flex-direction:column} .btn-map,.btn-outline,.btn-ghost{width:100%;justify-content:center} }
      `}</style>

      <div className="vp">
        <div className="vp-inner">

          {/* Header */}
          <div className="vp-head">
            <div className="vp-pill"><div className="p-dot" /> Land Verification</div>
            <h1 className="vp-title">Verify Land Records</h1>
            <p className="vp-sub">Upload a land document to scan and extract its details, or enter a Land ID directly to check registry records for disputes, encumbrances, and title status.</p>
          </div>

          {/* ── LOADING STATE ── */}
          {isLoading && (
            <div className="proc">
              <div className="proc-ring" />
              <div className="proc-title">
                {phase === "scanning" ? "Scanning document…" : "Checking registry…"}
              </div>
              <div className="proc-phase" key={scanStep}>{scanStep}</div>
              <div className="proc-rows">
                {(phase === "scanning"
                  ? ["Reading document", "Identifying text", "Extracting fields"]
                  : ["Registry lookup", "Encumbrance check", "Dispute records", "Building report"]
                ).map((l, i) => (
                  <div key={l} className="proc-row">
                    <div className="proc-dot" />
                    <span className="proc-lbl">{l}</span>
                    <div className="proc-bar"><div className="proc-fill" style={{ animationDelay:`${i * 0.3}s` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── EXTRACTED PANEL (after scan, before verify) ── */}
          {!isLoading && phase === "extracted" && extracted && (
            <ExtractedPanel
              data={extracted}
              onVerify={runVerify}
              onRetry={reset}
            />
          )}

          {/* ── RESULT ── */}
          {!isLoading && phase === "done" && result && (
            <>
              <ResultCard land={result.land} extracted={extracted} onMap={() => setMapOpen(true)} />
              {mapOpen && <MapModal land={result.land} onClose={() => setMapOpen(false)} />}
            </>
          )}

          {/* ── INPUT FORM ── */}
          {!isLoading && phase === "idle" && (
            <div className="card cp">
              {/* 2 Tabs */}
              <div className="tabs">
                {[
                  {
                    id: "upload", name: "Scan Document", hint: "Upload photo or file",
                    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:18,height:18}}><path strokeLinecap="round" d="M5 4a2 2 0 0 1 2-2h5l5 5v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4Zm7-2v5h5"/><path strokeLinecap="round" d="M7 13h6M7 10h3"/></svg>,
                  },
                  {
                    id: "id", name: "Enter Land ID", hint: "Survey / plot number",
                    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:18,height:18}}><path strokeLinecap="round" d="m17 17-3.9-3.9m0 0A6.5 6.5 0 1 0 4.6 4.6a6.5 6.5 0 0 0 8.5 8.5Z"/></svg>,
                  },
                ].map(m => (
                  <button key={m.id} className={`tab ${mode === m.id ? "on" : ""}`}
                    onClick={() => { setMode(m.id); setError(""); setFile(null); setPreview(null); }}>
                    <div className="tab-ico">{m.icon}</div>
                    <div className="tab-name">{m.name}</div>
                    <div className="tab-hint">{m.hint}</div>
                  </button>
                ))}
              </div>

              {error && (
                <div className="err">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:15,height:15,flexShrink:0,marginTop:1}}><path strokeLinecap="round" d="M10 2 1.5 17h17L10 2Zm0 6v4m0 2.5v.5"/></svg>
                  <span>{error}</span>
                </div>
              )}

              {/* ── UPLOAD mode ── */}
              {mode === "upload" && (
                <>
                  {!file ? (
                    <div className={`drop ${dragging ? "over" : ""}`}
                      onDragOver={e => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
                      onClick={() => fileRef.current?.click()}>
                      <div className="d-ico">
                        <svg viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.3" style={{width:56,height:56}}>
                          <rect x="10" y="4" width="36" height="48" rx="5" />
                          <path strokeLinecap="round" d="M18 18h20M18 25h20M18 32h12"/>
                          <circle cx="42" cy="42" r="10" fill="var(--accent-lt)" stroke="var(--accent)" strokeWidth="1.5"/>
                          <path stroke="var(--accent)" strokeLinecap="round" strokeWidth="1.8" d="M42 38v8M38 42h8"/>
                        </svg>
                      </div>
                      <div className="d-title">Upload land document</div>
                      <div className="d-sub">
                        Take a clear photo of your sale deed, patta, mutation record, or any land certificate.<br />
                        JPG, PNG, PDF accepted.
                      </div>
                      <button className="btn-br" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:13,height:13}}><path strokeLinecap="round" d="M8 3v7M5 6l3-3 3 3M2 12h12"/></svg>
                        Choose file or photo
                      </button>
                      <input ref={fileRef} type="file" accept="image/*,application/pdf"
                        style={{display:"none"}} capture="environment"
                        onChange={e => handleFile(e.target.files[0])} />
                    </div>
                  ) : (
                    <>
                      <div className="fp">
                        <div className="fp-thumb">
                          {preview && file.type.startsWith("image/")
                            ? <img src={preview} alt="" />
                            : <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" style={{width:20,height:20}}><path strokeLinecap="round" d="M5 4a2 2 0 0 1 2-2h5l5 5v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4Zm7-2v5h5M7 11h6M7 14h4"/></svg>}
                        </div>
                        <div>
                          <div className="fp-name">{file.name}</div>
                          <div className="fp-sz">{(file.size / 1024).toFixed(1)} KB · Ready to scan</div>
                        </div>
                        <button className="fp-rm" onClick={() => { setFile(null); setPreview(null); }}>
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" style={{width:14,height:14}}><path strokeLinecap="round" d="M3 3l10 10M13 3 3 13"/></svg>
                        </button>
                      </div>
                      {preview && file.type.startsWith("image/") && (
                        <div className="scan-wrap">
                          <img src={preview} alt="doc" className="scan-img" />
                          <div className="scan-over">
                            <div className="scan-line" />
                            <div className="scan-badge">
                              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:12,height:12}}><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><path strokeLinecap="round" d="M9 10h2m2 0h2M12 9v2m0 2v2"/></svg>
                              Ready to scan
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="divider" />
                      <button className="btn-sub" onClick={runScan}>
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:15,height:15}}><rect x="2" y="2" width="6" height="6" rx="1"/><rect x="12" y="2" width="6" height="6" rx="1"/><rect x="2" y="12" width="6" height="6" rx="1"/><path strokeLinecap="round" d="M12 13h2m2 0h2M15 12v2m0 2v2"/></svg>
                        Scan & Extract Document Details
                      </button>
                    </>
                  )}
                </>
              )}

              {/* ── LAND ID mode ── */}
              {mode === "id" && (
                <>
                  
                  <div className="fl">Land / Survey ID</div>
                  <input className="id-in" placeholder="e.g. MH-PN-2247-B"
                    value={landId}
                    onChange={e => setLandId(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === "Enter" && handleIdSubmit()} />
                  <button className="btn-sub" onClick={handleIdSubmit}>
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:15,height:15}}><path strokeLinecap="round" d="m17 17-3.9-3.9m0 0A6.5 6.5 0 1 0 4.6 4.6a6.5 6.5 0 0 0 8.5 8.5Z"/></svg>
                    Verify Land Record
                  </button>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}