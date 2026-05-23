"use client";
import { useState, useRef, useEffect } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const LAND_TYPES = [
  { id: "residential",  icon: "🏡", label: "Residential",  desc: "Plots & villa sites"   },
  { id: "commercial",   icon: "🏢", label: "Commercial",   desc: "Shops & offices"        },
  { id: "agricultural", icon: "🌾", label: "Agricultural", desc: "Farmland & fields"      },
  { id: "industrial",   icon: "🏭", label: "Industrial",   desc: "Factories & warehouses" },
];

const UNITS = [
  { id: "sqft", label: "Sq. Ft"    },
  { id: "sqm",  label: "Sq. Metre" },
  { id: "acre", label: "Acre"      },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSqft(val, unit) {
  const n = parseFloat(val) || 0;
  if (unit === "sqm")  return n * 10.764;
  if (unit === "acre") return n * 43560;
  return n;
}

function formatINR(n) {
  const num = Number(n);
  if (!num || isNaN(num)) return "—";
  if (num >= 10000000) return "₹" + (num / 10000000).toFixed(2) + " Cr";
  if (num >= 100000)   return "₹" + (num / 100000).toFixed(2)   + " L";
  return "₹" + Math.round(num).toLocaleString("en-IN");
}

function safeNum(n) { return isNaN(Number(n)) ? 0 : Number(n); }

// ─── AnimatedNumber ───────────────────────────────────────────────────────────

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);
  const t0   = useRef(null);
  useEffect(() => {
    from.current = display;
    t0.current   = null;
    const tick = (ts) => {
      if (!t0.current) t0.current = ts;
      const p = Math.min((ts - t0.current) / 900, 1);
      setDisplay(Math.round(from.current + (value - from.current) * (1 - Math.pow(1 - p, 4))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]); // eslint-disable-line
  return <span>{display.toLocaleString("en-IN")}</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LandValuator() {
  const [step,     setStep]     = useState(1);
  const [landType, setLandType] = useState("residential");
  const [size,     setSize]     = useState("");
  const [unit,     setUnit]     = useState("sqft");
  const [address,  setAddress]  = useState("");
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [loadMsg,  setLoadMsg]  = useState("");
  const [error,    setError]    = useState("");

  const sqft       = toSqft(size, unit);
  const canStep2   = !!landType;
  const canStep3   = sqft > 0;
  const canValuate = address.trim().length > 5;

  // ── API Call ──────────────────────────────────────────────────────────────

  async function fetchValuation() {
    setLoading(true);
    setError("");
    setLoadMsg("Locating area and fetching market data...");

    const msgs = [
      "Analyzing current price trends in your area...",
      "Comparing recent land transactions nearby...",
      "Calculating valuation based on market rates...",
    ];
    let ri = 0;
    const timer = setInterval(() => { ri++; if (ri < msgs.length) setLoadMsg(msgs[ri]); }, 1800);

    try {
      const res = await fetch("/api/valuate-land", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, landType, sqft }),
      });

      const responseBody = await res.json();
      if (!res.ok || !responseBody.success) {
        throw new Error(responseBody.message || `API error: ${res.status}`);
      }
      const parsed = responseBody.data;
      const r      = parsed.ratePerSqft || {};

      if (!parsed.totalValue || !parsed.totalValue.mid) {
        parsed.totalValue = {
          low:  Math.round(safeNum(r.low)  * Math.round(sqft)),
          mid:  Math.round(safeNum(r.mid)  * Math.round(sqft)),
          high: Math.round(safeNum(r.high) * Math.round(sqft)),
        };
      }

      setResult(parsed);
      setStep(4);
    } catch (err) {
      setError("Could not fetch valuation. Please check your address and try again. (" + err.message + ")");
    } finally {
      clearInterval(timer);
      setLoading(false);
      setLoadMsg("");
    }
  }

  // ── Step state helper ─────────────────────────────────────────────────────

  const stepState = (n) => step > n ? "done" : step === n ? "active" : "idle";

  // ── Shared class fragments ────────────────────────────────────────────────

  const cardCls   = "bg-white border border-black/[0.07] rounded-2xl shadow-sm";
  const innerCls  = "p-7 sm:p-8";
  const labelCls  = "block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2";
  const inputCls  = "w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-[15px] font-[Outfit,sans-serif] outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-600/10 focus:bg-white placeholder:text-slate-300 placeholder:italic";
  const btnAccent = "w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-[15px] rounded-xl px-6 py-3.5 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(22,163,74,0.3)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.4)] hover:-translate-y-0.5 active:translate-y-0";
  const btnDark   = "w-full flex items-center justify-center gap-2 text-white font-semibold text-[15px] rounded-xl px-6 py-3.5 transition hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-35 disabled:cursor-not-allowed";
  const btnGhost  = "bg-transparent border border-slate-200 hover:border-slate-400 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm rounded-xl px-5 py-3.5 transition";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="font-[Outfit,sans-serif] min-h-screen bg-[#fafaf8] text-[#1c1f2e]">

      {/* ══ Google Font ══ */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,600;0,700;1,500&display=swap'); @keyframes slide-up { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:none; } } .animate-slide-up { animation: slide-up 0.38s cubic-bezier(0.22,1,0.36,1) forwards; } @keyframes spin-custom { to { transform: rotate(360deg); } } .spinner { display:inline-block; width:15px; height:15px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin-custom 0.6s linear infinite; }`}</style>

      {/* ══ TOP BAR ══ */}
      <header className="sticky top-0 z-30 h-[60px] flex items-center justify-between px-4 sm:px-8" style={{background:"#1c1f2e",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center font-extrabold text-sm tracking-tighter" style={{background:"#16a34a",color:"#fff"}}>
            LV
          </div>
          <div>
            <div className="text-[16px] font-bold tracking-tight leading-none" style={{color:"#fff"}}>
              Land<span style={{color:"#4ade80"}}>Value</span>
            </div>
            <div className="text-[10.5px] mt-0.5 leading-none" style={{color:"rgba(255,255,255,0.4)"}}>Property Intelligence</div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Step dots */}
          <div className="flex items-center gap-1.5 rounded-full px-3.5 py-[5px]" style={{background:"rgba(255,255,255,0.08)"}}>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="w-[7px] h-[7px] rounded-full transition-all duration-300"
                style={{
                  background: stepState(n) === "done" ? "#4ade80" : stepState(n) === "active" ? "#fff" : "rgba(255,255,255,0.2)",
                  transform: stepState(n) === "active" ? "scale(1.3)" : "scale(1)"
                }}
              />
            ))}
          </div>

        </div>
      </header>

      {/* ══ MAIN LAYOUT ══ */}
      <div className="flex min-h-[calc(100vh-60px)]">

        {/* ══ LEFT PANEL (desktop only) ══ */}
        <aside className="hidden lg:flex w-[280px] flex-shrink-0 flex-col gap-10 p-10 sticky top-[60px] h-[calc(100vh-60px)] overflow-hidden" style={{background:"#1c1f2e"}}>
          {/* Glow orb */}
          <div className="absolute -bottom-16 -right-16 w-[220px] h-[220px] rounded-full" style={{background:"radial-gradient(circle, rgba(22,163,74,0.12) 0%, transparent 70%)"}} />

          {/* Title */}
          <div className="relative z-10">
            <h2 className="font-[Lora,serif] text-[22px] font-bold leading-snug tracking-tight" style={{color:"#fff"}}>
              Smart Land<br /><span style={{color:"#4ade80"}}>Valuation</span><br />Engine
            </h2>
            <p className="text-[13px] leading-relaxed mt-3" style={{color:"rgba(255,255,255,0.4)"}}>
              AI-powered price intelligence for Indian real estate markets.
            </p>
          </div>

          {/* Stats */}
          <div className="relative z-10 flex flex-col gap-6">
            {[
              { num: "50+",   lbl: "Cities Covered"    },
              { num: "3 sec", lbl: "Avg. Report Time"  },
              { num: "AI",    lbl: "Powered Analysis"  },
            ].map((s, i) => (
              <div key={i} className="pt-5" style={{borderTop:"1px solid rgba(255,255,255,0.08)"}}>
                <div className="font-[Lora,serif] text-[28px] font-semibold" style={{color:"#4ade80"}}>{s.num}</div>
                <div className="text-[11.5px] mt-0.5 uppercase tracking-widest" style={{color:"rgba(255,255,255,0.4)"}}>{s.lbl}</div>
              </div>
            ))}
          </div>

          {/* Step list */}
          <div className="relative z-10 flex flex-col gap-3 mt-auto">
            {[
              { n: 1, label: "Select Land Type" },
              { n: 2, label: "Enter Land Size"  },
              { n: 3, label: "Provide Location" },
            ].map((s) => {
              const st = stepState(s.n);
              return (
                <div key={s.n} className="flex items-center gap-2.5 text-[13px] transition-colors" style={{color: st === "idle" ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.85)"}}>
                  <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-all" style={{
                    background:   st === "done"   ? "#16a34a" : "transparent",
                    border:       st === "done"   ? "1px solid #16a34a" : st === "active" ? "1px solid #fff" : "1px solid rgba(255,255,255,0.12)",
                    color:        st === "done"   ? "#fff"    : st === "active" ? "#fff" : "rgba(255,255,255,0.3)",
                  }}>
                    {st === "done" ? "✓" : s.n}
                  </div>
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ══ CONTENT ══ */}
        <main className="flex-1 px-4 sm:px-8 py-8 sm:py-10 pb-20 max-w-[680px]">

          {/* ════ STEP 1 — Land Type ════ */}
          {step === 1 && (
            <div className="animate-slide-up">
              {/* Step header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-green-600 mb-1.5">
                  <span className="w-5 h-0.5 bg-green-600 rounded-full" />
                  Step 1 of 3
                </div>
                <h1 className="font-[Lora,serif] text-2xl sm:text-[28px] font-bold text-[#1c1f2e] leading-tight tracking-tight">
                  What type of land are you valuing?
                </h1>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Select the category that best describes the land you want to assess.
                </p>
              </div>

              <div className={cardCls}>
                <div className={innerCls}>
                  <div className="grid grid-cols-2 gap-2.5">
                    {LAND_TYPES.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setLandType(t.id)}
                        className={`relative overflow-hidden flex items-center gap-3 p-4 rounded-[14px] border-[1.5px] cursor-pointer transition-all duration-200 ${
                          landType === t.id
                            ? "border-green-600 bg-green-50 shadow-[0_0_0_3px_rgba(22,163,74,0.1),0_4px_12px_rgba(22,163,74,0.08)] -translate-y-0.5"
                            : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 hover:-translate-y-0.5 hover:shadow-md"
                        }`}
                      >
                        {/* Top accent bar */}
                        <div className={`absolute top-0 left-0 right-0 h-[3px] bg-green-600 rounded-t-[14px] transition-transform duration-200 origin-left ${landType === t.id ? "scale-x-100" : "scale-x-0"}`} />
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0 border shadow-sm transition ${landType === t.id ? "bg-green-50 border-green-200" : "bg-white border-slate-200"}`}>
                          {t.icon}
                        </div>
                        <div>
                          <div className={`text-[14px] font-semibold transition ${landType === t.id ? "text-green-700" : "text-[#1c1f2e]"}`}>
                            {t.label}
                          </div>
                          <div className="text-[12px] text-slate-400 mt-0.5">{t.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-7">
                    <button className={btnAccent} disabled={!canStep2} onClick={() => setStep(2)}>
                      Continue to Land Size →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ STEP 2 — Land Size ════ */}
          {step === 2 && (
            <div className="animate-slide-up">
              <div className="mb-6">
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-green-600 mb-1.5">
                  <span className="w-5 h-0.5 bg-green-600 rounded-full" />
                  Step 2 of 3
                </div>
                <h1 className="font-[Lora,serif] text-2xl sm:text-[28px] font-bold text-[#1c1f2e] leading-tight tracking-tight">
                  How big is the plot?
                </h1>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Enter the total land area in your preferred unit of measurement.
                </p>
              </div>

              <div className={cardCls}>
                <div className={innerCls}>
                  {/* Unit pills */}
                  <div className="mb-5">
                    <label className={labelCls}>Unit of Measurement</label>
                    <div className="flex gap-2">
                      {UNITS.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => setUnit(u.id)}
                          className={`px-5 py-2.5 border-[1.5px] rounded-[10px] text-[13px] font-semibold transition ${
                            unit === u.id
                              ? "border-green-600 bg-green-50 text-green-700"
                              : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-400 hover:text-slate-800"
                          }`}
                        >
                          {u.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size input */}
                  <div>
                    <label className={labelCls}>
                      Total Area ({unit === "sqft" ? "sq. ft" : unit === "sqm" ? "sq. metre" : "acres"})
                    </label>
                    <input
                      type="number"
                      min="1"
                      className={inputCls}
                      placeholder={unit === "acre" ? "e.g.  0.5" : unit === "sqm" ? "e.g.  200" : "e.g.  2400"}
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                    />
                    {sqft > 0 && (
                      <div className="mt-2.5 px-3.5 py-2.5 bg-green-50 border border-green-200/60 rounded-[10px] text-[13px] text-green-800 font-medium">
                        📐 &nbsp;Equivalent to <strong>{Math.round(sqft).toLocaleString("en-IN")} sq.ft</strong>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2.5 mt-7">
                    <button className={btnGhost} onClick={() => setStep(1)}>← Back</button>
                    <button className={`${btnAccent} flex-1`} style={{ width: "auto" }} disabled={!canStep3} onClick={() => setStep(3)}>
                      Continue to Address →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ STEP 3 — Address ════ */}
          {step === 3 && (
            <div className="animate-slide-up">
              <div className="mb-6">
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-green-600 mb-1.5">
                  <span className="w-5 h-0.5 bg-green-600 rounded-full" />
                  Step 3 of 3
                </div>
                <h1 className="font-[Lora,serif] text-2xl sm:text-[28px] font-bold text-[#1c1f2e] leading-tight tracking-tight">
                  Where is the land located?
                </h1>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Enter any address, pin code, or landmark near the land for precise area-level pricing.
                </p>
              </div>

              <div className={cardCls}>
                <div className={innerCls}>
                  <div className="bg-green-50 border border-green-200/60 rounded-xl px-4 py-3 text-[13.5px] text-green-800 font-medium leading-relaxed mb-5">
                    📍 Be as specific as possible — include area name, city, or nearby landmarks. Our AI will identify the locality and fetch current going rates.
                  </div>

                  <div>
                    <label className={labelCls}>Address / Landmark / Locality</label>
                    <textarea
                      className={`${inputCls} resize-y min-h-[100px] leading-relaxed`}
                      placeholder={"Examples:\n• Plot near Inorbit Mall, Malad West, Mumbai – 400064\n• Survey No. 45, Whitefield, Bangalore – 560066\n• Farmland near Lonavala, Pune-Mumbai Highway"}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    <p className="text-[12px] text-slate-400 italic mt-1.5">More detail = more accurate valuation</p>
                  </div>

                  {error && (
                    <div className="mt-4 bg-red-50 border-[1.5px] border-red-200 rounded-xl px-4 py-3 text-[13.5px] text-red-800 font-medium">
                      ⚠️ {error}
                    </div>
                  )}

                  <div className="flex gap-2.5 mt-7">
                    <button className={btnGhost} onClick={() => { setStep(2); setError(""); }}>← Back</button>
                    <button
                      className={`${btnAccent} flex-1`}
                      style={{ width: "auto" }}
                      disabled={!canValuate || loading}
                      onClick={fetchValuation}
                    >
                      {loading
                        ? <><span className="spinner" />{loadMsg || "Fetching..."}</>
                        : "Get Valuation Report →"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ STEP 4 — Results ════ */}
          {step === 4 && result && (
            <div className="animate-slide-up">

              {/* ── Hero card ── */}
              <div className="rounded-[20px] overflow-hidden mb-4" style={{boxShadow:"0 8px 40px rgba(0,0,0,0.35)",border:"1px solid rgba(255,255,255,0.07)"}}>
                {/* Dark top */}
                <div className="relative px-7 pt-7 pb-6 overflow-hidden" style={{background:"#1c1f2e"}}>
                  {/* Green accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-[3px]" style={{background:"linear-gradient(90deg,#16a34a,#4ade80,#16a34a)"}} />

                  <div className="relative z-10">
                    <div className="flex items-center gap-2.5 mb-3.5">
                      <span className="text-[10.5px] tracking-[0.14em] uppercase font-bold" style={{color:"rgba(255,255,255,0.45)"}}>
                        Estimated Market Value
                      </span>
                      {result.marketTrend && (
                        <span style={{
                          fontSize:"11px", fontWeight:700, padding:"2px 10px", borderRadius:"30px",
                          border:"1px solid rgba(255,255,255,0.12)",
                          background: result.marketTrend === "rising" ? "rgba(22,163,74,0.25)" : result.marketTrend === "declining" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.1)",
                          color: result.marketTrend === "rising" ? "#4ade80" : result.marketTrend === "declining" ? "#fca5a5" : "rgba(255,255,255,0.7)",
                        }}>
                          {result.marketTrend === "rising" ? "↑ Rising Market" : result.marketTrend === "declining" ? "↓ Declining" : "→ Stable"}
                        </span>
                      )}
                    </div>

                    <div className="font-[Lora,serif] font-bold leading-[1.05] tracking-tight" style={{fontSize:"clamp(32px,6vw,48px)",color:"#ffffff"}}>
                      {formatINR(result.totalValue?.mid)}
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-[14.5px]" style={{color:"rgba(255,255,255,0.5)"}}>
                      <span className="font-semibold" style={{color:"#4ade80"}}>
                        ₹<AnimatedNumber value={safeNum(result.ratePerSqft?.mid)} />
                      </span>
                      <span style={{opacity:0.4}}>per sq.ft</span>
                      <span style={{opacity:0.3}}>·</span>
                      <span>{result.locality || result.areaIdentified}</span>
                    </div>
                  </div>
                </div>

                {/* Light green bottom strip */}
                <div className="bg-green-50 border-t border-green-200/40 px-7 py-4 flex justify-between items-start gap-3 flex-wrap">
                  {[
                    { label: "Conservative", val: formatINR(result.totalValue?.low),  accent: false },
                    { label: "Market Rate",  val: formatINR(result.totalValue?.mid),  accent: true  },
                    { label: "Premium",      val: formatINR(result.totalValue?.high), accent: false },
                  ].map((r, i) => (
                    <div key={i} className="text-center">
                      <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1">{r.label}</div>
                      <div className={`text-[15px] font-bold ${r.accent ? "text-green-700" : "text-[#1c1f2e]"}`}>{r.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Property chips ── */}
              <div className={`${cardCls} px-4 py-3 mb-4 flex flex-wrap gap-1.5 items-center`}>
                {[
                  `📍 ${result.areaIdentified}`,
                  `${LAND_TYPES.find((t) => t.id === result.landType)?.icon || "🏡"} ${LAND_TYPES.find((t) => t.id === result.landType)?.label || result.landType}`,
                  `📐 ${safeNum(result.sizeInSqft).toLocaleString("en-IN")} sq.ft`,
                ].map((chip, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5">
                    {chip}
                  </span>
                ))}
              </div>

              {/* ── Market overview ── */}
              {result.marketOverview && (
                <div className="bg-white border border-black/[0.07] border-l-4 border-l-green-600 rounded-r-2xl px-5 py-4 mb-4 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-2">Market Overview</div>
                  <p className="text-[14px] text-slate-800 leading-[1.75]">{result.marketOverview}</p>
                  {result.trendNote && (
                    <div className="flex items-center gap-1.5 mt-2.5 text-[13px] text-slate-500 italic">
                      <span>📈</span> {result.trendNote}
                    </div>
                  )}
                </div>
              )}

              {/* ── 4 stat tiles ── */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {/* Rate */}
                <div className="group relative overflow-hidden bg-white border border-black/[0.07] rounded-[14px] p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-green-600 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1.5">Rate / sq.ft</div>
                  <div className="text-[18px] font-bold text-[#1c1f2e] tracking-tight">₹{safeNum(result.ratePerSqft?.mid).toLocaleString("en-IN")}</div>
                  <div className="text-[11px] text-slate-400 mt-1">market benchmark</div>
                </div>

                {/* Trend */}
                <div className="group relative overflow-hidden bg-white border border-black/[0.07] rounded-[14px] p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-green-600 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1.5">Market Trend</div>
                  <div className="text-[18px] font-bold">
                    <span className={`text-[12.5px] font-bold px-3 py-1 rounded-lg border ${
                      result.marketTrend === "rising"    ? "bg-green-50 text-green-700 border-green-200"  :
                      result.marketTrend === "declining" ? "bg-orange-50 text-orange-700 border-orange-200" :
                      "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {result.marketTrend === "rising" ? "↑ Rising" : result.marketTrend === "declining" ? "↓ Declining" : "→ Stable"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">current direction</div>
                </div>

                {/* Plot area */}
                <div className="group relative overflow-hidden bg-white border border-black/[0.07] rounded-[14px] p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-green-600 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1.5">Plot Area</div>
                  <div className="text-[18px] font-bold text-[#1c1f2e] tracking-tight">{safeNum(result.sizeInSqft).toLocaleString("en-IN")}</div>
                  <div className="text-[11px] text-slate-400 mt-1">square feet</div>
                </div>

                {/* Confidence */}
                <div className="group relative overflow-hidden bg-white border border-black/[0.07] rounded-[14px] p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-green-600 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1.5">Confidence</div>
                  <div className="text-[18px] font-bold">
                    <span className={`text-[12px] font-bold px-2.5 py-1 rounded-[7px] border ${
                      result.dataConfidence === "high" ? "text-green-700 bg-green-50 border-green-200" :
                      result.dataConfidence === "low"  ? "text-red-700 bg-red-50 border-red-200"       :
                      "text-amber-700 bg-amber-50 border-amber-200"
                    }`}>
                      {result.dataConfidence === "high" ? "High ✓" : result.dataConfidence === "low" ? "Low ⚠" : "Medium ~"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">data match quality</div>
                </div>
              </div>

              {/* ── Price range breakdown ── */}
              <div className={`${cardCls} p-6 mb-4`}>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-4 after:content-[''] after:flex-1 after:h-px after:bg-slate-100">
                  Price Range Breakdown
                </div>
                {[
                  { label: "Conservative Estimate", sub: "Lower bound – cautious market",  rate: result.ratePerSqft?.low,  total: result.totalValue?.low,  w: "70%",  color: "#60a5fa", bar: "bg-blue-400"  },
                  { label: "Market Estimate",        sub: "Most probable current value",    rate: result.ratePerSqft?.mid,  total: result.totalValue?.mid,  w: "87%",  color: "#16a34a", bar: "bg-green-600" },
                  { label: "Premium Estimate",       sub: "Upper bound – best-case value",  rate: result.ratePerSqft?.high, total: result.totalValue?.high, w: "100%", color: "#0f766e", bar: "bg-teal-700"  },
                ].map((row, i) => (
                  <div key={i} className={i < 2 ? "mb-5" : ""}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[14px] font-semibold text-slate-800">{row.label}</div>
                        <div className="text-[12px] text-slate-400 mt-0.5">{row.sub}</div>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <div className="text-[16px] font-bold" style={{ color: row.color }}>{formatINR(row.total)}</div>
                        <div className="text-[12px] text-slate-400">₹{safeNum(row.rate).toLocaleString("en-IN")} / sq.ft</div>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                      <div className={`h-full rounded-full transition-all duration-[1100ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${row.bar}`} style={{ width: row.w, opacity: 0.85 }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Price factors ── */}
              {Array.isArray(result.priceFactors) && result.priceFactors.length > 0 && (
                <div className={`${cardCls} p-6 mb-4`}>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-4 after:content-[''] after:flex-1 after:h-px after:bg-slate-100">
                    Key Price Factors
                  </div>
                  {result.priceFactors.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-2 last:mb-0 hover:bg-slate-100 hover:border-slate-200 transition-colors">
                      <div className={`w-[9px] h-[9px] rounded-full flex-shrink-0 mt-1 ${f.impact === "positive" ? "bg-green-600" : "bg-orange-500"}`} />
                      <div className="flex-1">
                        <div className="text-[14px] font-semibold text-slate-800">{f.factor}</div>
                        <div className="text-[12.5px] text-slate-500 mt-0.5 leading-relaxed">{f.detail}</div>
                      </div>
                      <span className={`flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg border ml-2 ${
                        f.impact === "positive"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-orange-50 text-orange-700 border-orange-200"
                      }`}>
                        {f.impact === "positive" ? "↑ Positive" : "↓ Negative"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Nearby landmarks ── */}
              {Array.isArray(result.nearbyLandmarks) && result.nearbyLandmarks.length > 0 && (
                <div className={`${cardCls} p-5 mb-4`}>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-3.5 after:content-[''] after:flex-1 after:h-px after:bg-slate-100">
                    Nearby Landmarks Identified
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.nearbyLandmarks.map((lm, i) => (
                      <span key={i} className="text-[13px] font-medium bg-slate-50 border border-slate-200 rounded-[9px] px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors">
                        📌 {lm}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── New valuation ── */}
              <button
                className={`${btnDark} mb-3`}
                style={{background:"#1c1f2e"}}
                onMouseEnter={e => e.currentTarget.style.background="#2d3147"}
                onMouseLeave={e => e.currentTarget.style.background="#1c1f2e"}
                onClick={() => { setStep(1); setResult(null); setAddress(""); setSize(""); setError(""); }}
              >
                ← Start New Valuation
              </button>

              {/* ── Disclaimer ── */}
              <div className="text-[12px] text-slate-400 text-center leading-[1.8] px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl mt-1">
                ⚠️ AI-generated estimate for reference only. Actual prices depend on legal title, soil condition,
                zoning laws, and live market conditions. Consult a registered property valuer before any financial or legal decision.
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
