"use client";
import { useState, useRef, useEffect } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const SERVICES = [
  {
    id: "tax", icon: "🧾", label: "Property Tax Update", short: "Update tax receipt name",
    desc: "Update your name on the property tax receipt after purchase or inheritance.",
    tag: "Municipal", color: "emerald",
    steps: ["Visit municipal office (BMC/MCGM/Gram Panchayat)","Submit sale deed / gift deed as proof","Fill Form 1 (name mutation form)","Pay nominal mutation fee","Receive updated receipt in 7–15 days"],
    docs: ["Sale Deed / Gift Deed (original + photocopy)","Previous tax receipt","Aadhaar card","Passport-size photo","NOC from previous owner (if applicable)"],
  },
  {
    id: "electricity", icon: "⚡", label: "Electricity Name Update", short: "Change name on power bill",
    desc: "Transfer or update the electricity connection name in your new home.",
    tag: "Utility", color: "amber",
    steps: ["Visit your DISCOM office (MSEDCL / BEST / BSES etc.)","Fill name transfer application form","Submit ownership proof + ID","Pay security deposit if required","Updated bill in next billing cycle"],
    docs: ["Property ownership proof (sale deed / rent agreement)","Previous electricity bill","Aadhaar card / Voter ID","Passport photo","NOC from previous tenant (if rented)"],
  },
  {
    id: "water", icon: "💧", label: "Water Bill Name Update", short: "Update water connection name",
    desc: "Get the water connection / billing transferred to your name.",
    tag: "Utility", color: "sky",
    steps: ["Visit local municipal water department","Carry ownership/tenancy proof","Submit name change application","Pay applicable transfer charges","Updated bill in 10–20 working days"],
    docs: ["Sale deed / rent agreement","Previous water bill","Aadhaar / PAN card","Passport photo","NOC from previous occupant"],
  },
  {
    id: "noc", icon: "📋", label: "NOC Certificate", short: "No Objection Certificate",
    desc: "Generate a legally formatted NOC for property sale, rent, bank loan or society.",
    tag: "Legal Draft", color: "violet", aiDraft: true,
    fields: [
      { id: "noc_type",  label: "NOC Type",        type: "select",   options: ["Property Sale","Bank Loan","Society","Rental","Inheritance","Other"] },
      { id: "from_name", label: "Issuer Name",      type: "text",     placeholder: "Full name of person issuing NOC" },
      { id: "from_addr", label: "Issuer Address",   type: "textarea", placeholder: "Complete address" },
      { id: "to_name",   label: "Receiver Name",    type: "text",     placeholder: "Full name of receiver" },
      { id: "property",  label: "Property Details", type: "textarea", placeholder: "Plot no., survey no., area, city..." },
      { id: "purpose",   label: "Purpose / Reason", type: "textarea", placeholder: "Describe why this NOC is being issued..." },
      { id: "date",      label: "Date",             type: "date" },
    ],
  },
  {
    id: "rental", icon: "🏠", label: "Rental Agreement", short: "Make rent agreement",
    desc: "Legally formatted rental agreement ready for stamp paper and registration.",
    tag: "Document Draft", color: "emerald", aiDraft: true,
    fields: [
      { id: "landlord_name", label: "Landlord Full Name",       type: "text",    placeholder: "As per Aadhaar" },
      { id: "landlord_addr", label: "Landlord Address",         type: "textarea",placeholder: "Permanent address" },
      { id: "tenant_name",   label: "Tenant Full Name",         type: "text",    placeholder: "As per Aadhaar" },
      { id: "tenant_addr",   label: "Tenant Address",           type: "textarea",placeholder: "Permanent address" },
      { id: "property_addr", label: "Property Address",         type: "textarea",placeholder: "Complete address of rented property" },
      { id: "property_type", label: "Property Type",            type: "select",  options: ["1 BHK","2 BHK","3 BHK","Studio","Shop","Office","Other"] },
      { id: "rent",          label: "Monthly Rent (₹)",         type: "number",  placeholder: "e.g. 15000" },
      { id: "deposit",       label: "Security Deposit (₹)",     type: "number",  placeholder: "e.g. 45000" },
      { id: "start_date",    label: "Agreement Start Date",     type: "date" },
      { id: "duration",      label: "Agreement Duration",       type: "select",  options: ["11 Months","1 Year","2 Years","3 Years"] },
      { id: "notice_period", label: "Notice Period",            type: "select",  options: ["1 Month","2 Months","3 Months"] },
      { id: "special_terms", label: "Special Terms (Optional)", type: "textarea",placeholder: "e.g. No pets, no sublet, maintenance terms..." },
    ],
  },
  {
    id: "sale_deed", icon: "📝", label: "Sale Deed / Agreement", short: "Buy-sell property document",
    desc: "Professionally drafted sale deed or agreement to sell for property transactions.",
    tag: "Document Draft", color: "orange", aiDraft: true,
    fields: [
      { id: "seller_name",   label: "Seller Full Name",       type: "text",    placeholder: "As per Aadhaar / PAN" },
      { id: "seller_addr",   label: "Seller Address",         type: "textarea",placeholder: "Permanent address" },
      { id: "buyer_name",    label: "Buyer Full Name",        type: "text",    placeholder: "As per Aadhaar / PAN" },
      { id: "buyer_addr",    label: "Buyer Address",          type: "textarea",placeholder: "Permanent address" },
      { id: "property_desc", label: "Property Description",   type: "textarea",placeholder: "Survey no., plot no., area, taluka, district..." },
      { id: "area_sqft",     label: "Total Area (sq.ft)",     type: "number",  placeholder: "e.g. 1200" },
      { id: "sale_price",    label: "Sale Consideration (₹)", type: "number",  placeholder: "Total agreed sale amount" },
      { id: "advance_paid",  label: "Advance Paid (₹)",       type: "number",  placeholder: "Token / advance amount" },
      { id: "balance_due",   label: "Balance Due (₹)",        type: "number",  placeholder: "Remaining amount" },
      { id: "possession",    label: "Possession Date",        type: "date" },
      { id: "deed_type",     label: "Document Type",          type: "select",  options: ["Agreement to Sell","Sale Deed","Gift Deed","Partition Deed"] },
    ],
  },
  {
    id: "lawyer", icon: "⚖️", label: "Legal Help / Lawyer", short: "Connect with a property lawyer",
    desc: "Get guidance on which lawyer to contact, what to ask, and what documents to prepare.",
    tag: "AI Guide", color: "slate", lawyerGuide: true,
  },
];

// ─── Theme map ────────────────────────────────────────────────────────────────
const T = {
  emerald: { light:"bg-emerald-50", border:"border-emerald-200", text:"text-emerald-700", dot:"bg-emerald-500", btn:"bg-emerald-600 hover:bg-emerald-700", badge:"bg-emerald-100 text-emerald-700 border-emerald-200", glow:"shadow-emerald-200", icon:"bg-emerald-100 text-emerald-600", stripe:"from-emerald-500 to-teal-500" },
  amber:   { light:"bg-amber-50",   border:"border-amber-200",   text:"text-amber-700",   dot:"bg-amber-500",   btn:"bg-amber-500 hover:bg-amber-600",     badge:"bg-amber-100 text-amber-700 border-amber-200",   glow:"shadow-amber-200",   icon:"bg-amber-100 text-amber-600",   stripe:"from-amber-400 to-orange-400" },
  sky:     { light:"bg-sky-50",     border:"border-sky-200",     text:"text-sky-700",     dot:"bg-sky-500",     btn:"bg-sky-600 hover:bg-sky-700",         badge:"bg-sky-100 text-sky-700 border-sky-200",         glow:"shadow-sky-200",     icon:"bg-sky-100 text-sky-600",       stripe:"from-sky-500 to-blue-500" },
  violet:  { light:"bg-violet-50",  border:"border-violet-200",  text:"text-violet-700",  dot:"bg-violet-500",  btn:"bg-violet-600 hover:bg-violet-700",   badge:"bg-violet-100 text-violet-700 border-violet-200", glow:"shadow-violet-200",  icon:"bg-violet-100 text-violet-600", stripe:"from-violet-500 to-purple-500" },
  orange:  { light:"bg-orange-50",  border:"border-orange-200",  text:"text-orange-700",  dot:"bg-orange-500",  btn:"bg-orange-500 hover:bg-orange-600",   badge:"bg-orange-100 text-orange-700 border-orange-200", glow:"shadow-orange-200",  icon:"bg-orange-100 text-orange-600", stripe:"from-orange-500 to-red-400" },
  slate:   { light:"bg-slate-50",   border:"border-slate-200",   text:"text-slate-700",   dot:"bg-slate-500",   btn:"bg-slate-700 hover:bg-slate-800",     badge:"bg-slate-100 text-slate-600 border-slate-200",   glow:"shadow-slate-200",   icon:"bg-slate-100 text-slate-600",   stripe:"from-slate-500 to-slate-700" },
};

function cn(...c) { return c.filter(Boolean).join(" "); }

// ─── Component ────────────────────────────────────────────────────────────────

export default function DocumentServices() {
  const [view,     setView]     = useState("home");
  const [svcId,    setSvcId]    = useState(null);
  const [formData, setFormData] = useState({});
  const [docText,  setDocText]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [loadMsg,  setLoadMsg]  = useState("");
  const [error,    setError]    = useState("");
  const [copied,   setCopied]   = useState(false);

  const svc  = SERVICES.find(s => s.id === svcId);
  const th   = svc ? T[svc.color] : T.emerald;

  const INPUT = cn(
    "w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3",
    "text-[14.5px] outline-none font-[Outfit,sans-serif]",
    "transition-all duration-150",
    "focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white",
    "placeholder:text-slate-300"
  );
  const LBL = "block text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2";

  function openService(id) { setSvcId(id); setView("service"); setFormData({}); setDocText(""); setError(""); }
  function reset()         { setView("home"); setSvcId(null); setFormData({}); setDocText(""); setError(""); }
  function setField(id, v) { setFormData(p => ({...p, [id]: v})); }

  function isReady() {
    if (!svc?.fields) return true;
    return svc.fields
      .filter(f => !["special_terms"].includes(f.id))
      .every(f => (formData[f.id] || "").toString().trim().length > 0);
  }

  async function generate() {
    setLoading(true); setError("");
    const msgs = ["Drafting your document…","Applying legal formatting…","Adding standard clauses…","Finalising…"];
    let ri = 0; setLoadMsg(msgs[0]);
    const t = setInterval(() => { ri = Math.min(ri+1, msgs.length-1); setLoadMsg(msgs[ri]); }, 1600);

    const fd = svc.fields?.map(f => `${f.label}: ${formData[f.id] || "Not provided"}`).join("\n") || "";

    const PROMPTS = {
      noc: `You are a senior Indian property lawyer with 20+ years of experience. Draft a complete, professional NO OBJECTION CERTIFICATE based on:
${fd}

STRICT FORMATTING RULES — follow exactly:
1. Start with a centered header block:
   ════════════════════════════════════════════════════════
                    NO OBJECTION CERTIFICATE
   ════════════════════════════════════════════════════════

2. Below header add: "Ref. No.: NOC/____/2025" and "Date: [use the date provided]"

3. Write TO: and FROM: blocks with full address details

4. Body must include:
   - Opening: "TO WHOMSOEVER IT MAY CONCERN"
   - Full formal paragraph stating the NOC with all legal language
   - Specific mention of property details
   - Statement that this is issued voluntarily without any pressure
   - Statement that issuer has no objection to the stated purpose
   - Any relevant legal protections or limitations

5. End with DECLARATIONS section:
   "I, [Issuer Name], do hereby solemnly declare and affirm that..."

6. Then a proper SIGNATURE BLOCK:

   ┌─────────────────────────────────┐    ┌─────────────────────────────────┐
   │                                 │    │                                 │
   │    AFFIX REVENUE STAMP          │    │    NOTARY / STAMP HERE          │
   │    (₹10 stamp paper)            │    │                                 │
   │                                 │    │                                 │
   └─────────────────────────────────┘    └─────────────────────────────────┘

   Signature of Issuer: _______________________
   Name (Block Letters): _______________________
   Date: _______________________
   Place: _______________________

7. WITNESS SECTION:
   Witness 1:                              Witness 2:
   Signature: ___________________          Signature: ___________________
   Name: _______________________          Name: _______________________
   Address: ____________________          Address: ____________________
   Date: _______________________          Date: _______________________

8. Footer: "This document was executed on _____ day of _____, 2025 at _____"

Return ONLY the complete formatted document. No extra commentary.`,

      rental: `You are a senior Indian property lawyer. Draft a complete, professional LEAVE AND LICENSE AGREEMENT / RENTAL AGREEMENT based on:
${fd}

STRICT FORMATTING RULES — follow exactly:

1. Header:
   ════════════════════════════════════════════════════════════════
              LEAVE AND LICENSE AGREEMENT
   ════════════════════════════════════════════════════════════════
   "This Agreement is executed on this _____ day of _____________, 2025"

2. PARTIES section with full details for both Licensor (Landlord) and Licensee (Tenant)

3. RECITALS — background of the agreement

4. PROPERTY DESCRIPTION — complete description clause

5. Numbered CLAUSES section covering:
   Clause 1: License Fee and Payment Terms
   Clause 2: Security Deposit
   Clause 3: Duration and Commencement
   Clause 4: Notice Period and Termination
   Clause 5: Maintenance and Repairs
   Clause 6: Utilities and Outgoings
   Clause 7: Subletting and Assignment
   Clause 8: Right of Inspection
   Clause 9: Damage and Indemnity
   Clause 10: Peaceful Possession
   Clause 11: Lock-in Period (if any)
   Clause 12: Governing Law
   ${formData.special_terms ? `Clause 13: Special Terms and Conditions — ${formData.special_terms}` : ""}

6. SCHEDULE OF PROPERTY

7. IN WITNESS WHEREOF section

8. SIGNATURE BLOCK:

   ════════════ LICENSOR (LANDLORD) ════════════    ════════════ LICENSEE (TENANT) ════════════

   Signature: _____________________________        Signature: _____________________________
   Name: _________________________________        Name: _________________________________
   Date: _________________________________        Date: _________________________________
   Place: ________________________________        Place: ________________________________

   ┌───────────────────────────────────┐           ┌───────────────────────────────────┐
   │                                   │           │                                   │
   │    STAMP / SEAL OF LICENSOR       │           │    STAMP / SEAL OF LICENSEE       │
   │                                   │           │                                   │
   └───────────────────────────────────┘           └───────────────────────────────────┘

9. WITNESSES:

   Witness 1:                                      Witness 2:
   Signature: ________________________             Signature: ________________________
   Full Name: ________________________             Full Name: ________________________
   Address:   ________________________             Address:   ________________________
              ________________________                        ________________________
   Date:      ________________________             Date:      ________________________

10. NOTARY / REGISTRATION BLOCK:
   ┌──────────────────────────────────────────────────────────────────┐
   │                                                                  │
   │   NOTARY SEAL / SUB-REGISTRAR STAMP                              │
   │                                                                  │
   │   Registration No.: _________________                            │
   │   Date of Registration: _____________                            │
   │   Book No.: _________ Volume: _______ Page: _______             │
   │                                                                  │
   └──────────────────────────────────────────────────────────────────┘

Governed by: Indian Contract Act, 1872 | Transfer of Property Act, 1882 | Registration Act, 1908

Return ONLY the complete formatted agreement. No extra commentary.`,

      sale_deed: `You are a senior Indian property lawyer. Draft a complete, professional ${formData.deed_type || "SALE DEED"} based on:
${fd}

STRICT FORMATTING RULES — follow exactly:

1. Header:
   ════════════════════════════════════════════════════════════════
                    ${(formData.deed_type || "SALE DEED").toUpperCase()}
   ════════════════════════════════════════════════════════════════
   Stamp Duty Paid: ₹_____________ (as per applicable rates)
   Registration No.: _____________
   Date of Execution: _____________

2. THIS ${(formData.deed_type || "SALE DEED").toUpperCase()} is made and executed at ________ on this _____ day of _________, 2025

3. BETWEEN section — full details for Seller (Vendor) and Buyer (Purchaser)

4. RECITALS — detailed background and chain of title

5. PROPERTY SCHEDULE:
   ┌────────────────────────────────────────────────────────────────┐
   │                    SCHEDULE OF PROPERTY                        │
   │  Survey / Plot No.: ___________  Area: ___________ sq.ft      │
   │  Location: ________________________________________________    │
   │  Boundaries:                                                   │
   │    North: ________________  South: ________________           │
   │    East:  ________________  West:  ________________           │
   └────────────────────────────────────────────────────────────────┘

6. Numbered CLAUSES:
   Clause 1: Consideration and Payment
   Clause 2: Title and Ownership Transfer
   Clause 3: Possession
   Clause 4: Indemnity and Covenant of Title
   Clause 5: Encumbrances
   Clause 6: Mutation and Registration
   Clause 7: Rights and Liabilities
   Clause 8: Governing Law and Jurisdiction
   Clause 9: Entire Agreement

7. PAYMENT RECEIPT:
   ┌────────────────────────────────────────────────────────────────┐
   │                    PAYMENT ACKNOWLEDGMENT                      │
   │  Total Sale Consideration: ₹________________________           │
   │  Advance / Token Paid:     ₹________________________           │
   │  Balance Due:              ₹________________________           │
   │  Mode of Payment:          □ Cash  □ Cheque  □ NEFT/RTGS      │
   │  Cheque/Reference No.:     ________________________            │
   └────────────────────────────────────────────────────────────────┘

8. SIGNATURE BLOCK:

   ════════════ SELLER (VENDOR) ════════════       ════════════ BUYER (PURCHASER) ════════════

   Signature: _____________________________        Signature: _____________________________
   Name: _________________________________        Name: _________________________________
   PAN No.: ______________________________        PAN No.: ______________________________
   Aadhaar No.: __________________________        Aadhaar No.: __________________________
   Date: _________________________________        Date: _________________________________

   ┌───────────────────────────────────┐           ┌───────────────────────────────────┐
   │                                   │           │                                   │
   │    LEFT THUMB IMPRESSION          │           │    LEFT THUMB IMPRESSION          │
   │    (Seller)                       │           │    (Buyer)                        │
   │                                   │           │                                   │
   └───────────────────────────────────┘           └───────────────────────────────────┘

9. WITNESSES:

   Witness 1:                                      Witness 2:
   Signature: ________________________             Signature: ________________________
   Full Name: ________________________             Full Name: ________________________
   Address:   ________________________             Address:   ________________________
   Date:      ________________________             Date:      ________________________

10. SUB-REGISTRAR / REGISTRATION:
   ┌──────────────────────────────────────────────────────────────────┐
   │                                                                  │
   │   OFFICE OF THE SUB-REGISTRAR                                    │
   │                                                                  │
   │   Registered at Book No.: _______  Volume: _______              │
   │   Page No.: ____________  Sr. No.: _______                      │
   │   Date: ________________  Stamp Duty: ₹__________              │
   │   Registration Fee: ₹___________                                │
   │                                                                  │
   │   Signature & Seal of Sub-Registrar: ______________________     │
   │                                                                  │
   └──────────────────────────────────────────────────────────────────┘

Governed by: Transfer of Property Act, 1882 | Registration Act, 1908 | Indian Stamp Act, 1899

Return ONLY the complete formatted document. No extra commentary.`,

      lawyer: `You are a helpful Indian legal advisor. The user needs help: "${formData.issue || "General property legal help"}"

Provide:
1. Type of lawyer needed
2. Top 5 things to discuss
3. Documents to bring
4. Approximate legal fee range
5. Helpful government portals
6. Red flags to watch out for

Be practical and India-specific. Format clearly with numbered sections.`,
    };

    try {
      const prompt = PROMPTS[svc.id] || PROMPTS.lawyer;

      // ── Call our Next.js API route (uses GEMINI_API_KEY server-side) ──
      const res = await fetch("/api/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.details || err.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setDocText(data.text?.trim() || "");
      setView("result");
    } catch(e) {
      setError("Could not generate. Please try again. (" + e.message + ")");
    } finally {
      clearInterval(t);
      setLoading(false);
      setLoadMsg("");
    }
  }

  function doPrint() {
    const w = window.open("","_blank");
    w.document.write(`<html><head><title>${svc?.label}</title><style>
      @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&display=swap');
      * { box-sizing: border-box; }
      body {
        font-family: 'EB Garamond', 'Times New Roman', serif;
        font-size: 13pt; line-height: 1.95; margin: 0;
        color: #1a1a1a; background: #fff;
      }
      .page {
        max-width: 800px; margin: 0 auto;
        padding: 60px 70px 80px;
        border-left: 6px solid #1a1a1a;
      }
      pre {
        white-space: pre-wrap; font-family: 'EB Garamond','Times New Roman',serif;
        font-size: 13pt; line-height: 1.95; margin: 0;
      }
      @media print {
        body { margin: 0; }
        .page { border: none; padding: 40px 50px; }
      }
    </style></head>
    <body><div class="page"><pre>${docText.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></div></body></html>`);
    w.document.close(); setTimeout(()=>w.print(),500);
  }

  function doDownload() {
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([docText],{type:"text/plain"})), download: `${(svc?.label||"doc").replace(/\s+/g,"_")}.txt` });
    a.click();
  }

  function doCopy() {
    navigator.clipboard.writeText(docText).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000); });
  }

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div style={{fontFamily:"'Outfit',sans-serif"}} className="min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Lora:wght@600;700&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        .anim{animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both}
        @keyframes spinR{to{transform:rotate(360deg)}}
        .spin{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:spinR .55s linear infinite}
        .doc-body{white-space:pre-wrap;font-family:'Courier New',monospace;font-size:13px;line-height:1.95;color:#1e293b}
        select{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2310b981' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:40px;-webkit-appearance:none;appearance:none}
        .card-hover{transition:all .22s ease}
        .card-hover:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(0,0,0,.09)}
        .step-connector{width:2px;height:24px;background:linear-gradient(to bottom,#e2e8f0,transparent);margin:2px auto}
      `}</style>

      {/* ══ TOPBAR ══ */}
      <header className="sticky top-0 z-40" style={{background:"#0f172a",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <div className="flex items-center justify-between h-[62px] px-5 sm:px-8">
          <button onClick={reset} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{background:"linear-gradient(135deg,#10b981,#0d9488)"}}>
              <span className="text-white font-black text-[13px] tracking-tight">DS</span>
            </div>
            <div className="text-left">
              <div className="text-[15px] font-bold leading-none" style={{color:"#ffffff"}}>
                Doc<span style={{color:"#34d399"}}>Services</span>
              </div>
              <div className="text-[10px] mt-0.5 leading-none font-medium" style={{color:"rgba(255,255,255,0.35)"}}>Legal Document Assistant</div>
            </div>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-1.5 rounded-full tracking-wider uppercase" style={{color:"#34d399",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)"}}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:"#34d399"}} />
              AI Powered
            </div>
            {view !== "home" && (
              <button onClick={reset} className="text-[12px] px-3 py-1.5 rounded-lg transition font-medium" style={{color:"rgba(255,255,255,0.4)",border:"1px solid rgba(255,255,255,0.1)"}}
                onMouseEnter={e=>{e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="rgba(255,255,255,0.25)";}}
                onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,0.4)";e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";}}>
                ← Home
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-62px)]">

        {/* ══ SIDEBAR ══ */}
        <aside className="hidden xl:flex w-[256px] flex-shrink-0 flex-col sticky top-[62px] h-[calc(100vh-62px)] overflow-y-auto" style={{background:"#0f172a",borderRight:"1px solid rgba(255,255,255,0.05)"}}>
          <div className="p-6 pb-3" style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{color:"rgba(255,255,255,0.3)"}}>All Services</p>
          </div>
          <nav className="flex-1 p-3">
            {SERVICES.map(s => {
              const active = svcId === s.id;
              const tc = T[s.color];
              return (
                <button key={s.id} onClick={()=>openService(s.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left mb-1 transition-all group"
                  style={{
                    background: active ? "rgba(255,255,255,0.08)" : "transparent",
                    color: active ? "#ffffff" : "rgba(255,255,255,0.4)",
                  }}
                  onMouseEnter={e=>{ if(!active){ e.currentTarget.style.color="rgba(255,255,255,0.8)"; e.currentTarget.style.background="rgba(255,255,255,0.04)"; }}}
                  onMouseLeave={e=>{ if(!active){ e.currentTarget.style.color="rgba(255,255,255,0.4)"; e.currentTarget.style.background="transparent"; }}}
                >
                  <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-[16px] flex-shrink-0 transition",
                    active ? tc.icon : ""
                  )} style={!active ? {background:"rgba(255,255,255,0.04)"} : {}}>{s.icon}</span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold leading-tight truncate">{s.label}</div>
                    <div className="text-[10.5px] mt-0.5 font-medium" style={{color: active ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)"}}>{s.tag}</div>
                  </div>
                  {active && <div className={cn("w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0", tc.dot)} />}
                </button>
              );
            })}
          </nav>
          <div className="p-4" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
            <div className="rounded-xl p-3" style={{background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)"}}>
              <div className="text-[11px] font-bold mb-1" style={{color:"#34d399"}}>🔒 Private & Secure</div>
              <div className="text-[11px] leading-relaxed" style={{color:"rgba(255,255,255,0.35)"}}>Documents are never stored. Generated on-demand only.</div>
            </div>
          </div>
        </aside>

        {/* ══ CONTENT ══ */}
        <main className="flex-1 min-w-0 p-5 sm:p-8 pb-24">

          {/* ══════════ HOME ══════════ */}
          {view === "home" && (
            <div className="max-w-[780px] mx-auto anim">
              {/* Hero */}
              <div className="relative rounded-3xl overflow-hidden p-8 sm:p-10 mb-8" style={{background:"#0f172a",boxShadow:"0 20px 60px rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.07)"}}>
                <div className="absolute inset-0" style={{background:"radial-gradient(ellipse at top right, rgba(16,185,129,0.12), transparent 60%)"}} />
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{background:"linear-gradient(90deg,transparent,#10b981,transparent)"}} />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5" style={{background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)",color:"#6ee7b7"}}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{background:"#34d399"}} />
                    Property Document Centre
                  </div>
                  <h1 className="font-[Lora,serif] text-3xl sm:text-4xl font-bold leading-tight mb-3" style={{color:"#ffffff"}}>
                    All your property<br />
                    <span style={{color:"#34d399"}}>paperwork, simplified.</span>
                  </h1>
                  <p className="text-[15px] leading-relaxed max-w-lg" style={{color:"rgba(255,255,255,0.5)"}}>
                    AI-powered documents, legal guidance, and step-by-step help for tax updates, bills, NOC, rental & sale deeds — all in one place.
                  </p>
                </div>
              </div>

              {/* Service grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SERVICES.map(s => {
                  const tc = T[s.color];
                  return (
                    <button key={s.id} onClick={()=>openService(s.id)}
                      className="card-hover group relative text-left bg-white border border-slate-100 rounded-2xl p-5 shadow-sm overflow-hidden"
                    >
                      {/* Top gradient stripe */}
                      <div className={cn("absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300", tc.stripe)} />

                      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-3.5 transition-transform group-hover:scale-110", tc.icon)}>
                        {s.icon}
                      </div>

                      <div className="text-[14.5px] font-bold text-slate-800 mb-1 leading-tight">{s.label}</div>
                      <div className="text-[12.5px] text-slate-400 leading-relaxed mb-3">{s.desc}</div>

                      <div className="flex items-center justify-between">
                        <span className={cn("text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border", tc.badge)}>
                          {s.tag}
                        </span>
                        <span className="text-slate-300 group-hover:text-slate-500 transition text-sm font-medium">→</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom info bar */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: "🤖", title: "AI-Assisted",    sub: "Documents drafted in seconds" },
                  { icon: "🖨️", title: "Print Ready",    sub: "Formatted for stamp paper use" },
                  { icon: "🔒", title: "Never Stored",   sub: "Your data stays on your device" },
                ].map((item,i) => (
                  <div key={i} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <div className="text-[13px] font-bold text-slate-700">{item.title}</div>
                      <div className="text-[11.5px] text-slate-400">{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════ SERVICE VIEW ══════════ */}
          {view === "service" && svc && (
            <div className="max-w-[680px] mx-auto anim">

              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
                <button onClick={reset} className="hover:text-slate-700 transition">All Services</button>
                <span>/</span>
                <span className={cn("font-semibold", th.text)}>{svc.label}</span>
              </div>

              {/* Service header card */}
              <div className={cn("relative rounded-2xl overflow-hidden p-6 mb-5 border", th.light, th.border)}>
                <div className={cn("absolute top-0 left-0 bottom-0 w-[4px] bg-gradient-to-b", th.stripe)} />
                <div className="flex items-start gap-4 pl-2">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-sm", th.icon)}>{svc.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="font-[Lora,serif] text-xl font-bold text-slate-900">{svc.label}</h1>
                      <span className={cn("text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border", th.badge)}>{svc.tag}</span>
                    </div>
                    <p className="text-[13.5px] text-slate-500 mt-1 leading-relaxed">{svc.desc}</p>
                  </div>
                </div>
              </div>

              {/* ── Guide view (tax, electricity, water) ── */}
              {!svc.aiDraft && !svc.lawyerGuide && (
                <div className="flex flex-col gap-4">
                  {/* Steps */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
                      <span className="text-sm">📋</span>
                      <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Step-by-Step Process</span>
                    </div>
                    <div className="p-5">
                      {svc.steps.map((step, i) => (
                        <div key={i}>
                          <div className="flex items-start gap-3.5">
                            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0", th.dot)}>
                              {i+1}
                            </div>
                            <div className="pt-0.5">
                              <p className="text-[14px] text-slate-700 leading-relaxed font-medium">{step}</p>
                            </div>
                          </div>
                          {i < svc.steps.length-1 && <div className="step-connector" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Docs required */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
                      <span className="text-sm">📁</span>
                      <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Documents Required</span>
                    </div>
                    <div className="p-4 grid grid-cols-1 gap-2">
                      {svc.docs.map((doc, i) => (
                        <div key={i} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border", th.light, th.border)}>
                          <div className={cn("w-2 h-2 rounded-full flex-shrink-0", th.dot)} />
                          <span className={cn("text-[13.5px] font-medium", th.text)}>{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pro tip */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">💡</div>
                    <div>
                      <div className="text-[13px] font-bold text-amber-800 mb-1">Pro Tip</div>
                      <p className="text-[13px] text-amber-700 leading-relaxed">Carry originals + 2 self-attested photocopies of each document. Always ask for an acknowledgment receipt when submitting your application.</p>
                    </div>
                  </div>

                  <button onClick={reset} className="flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-400 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold text-[14px] rounded-xl px-5 py-3.5 transition">
                    ← Back to All Services
                  </button>
                </div>
              )}

              {/* ── Lawyer guide ── */}
              {svc.lawyerGuide && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
                  <div>
                    <label className={LBL}>Describe your legal issue or question</label>
                    <textarea
                      className={cn(INPUT, "min-h-[120px] resize-y leading-relaxed")}
                      placeholder="e.g. I bought a flat in Mumbai but the previous owner's name is still on electricity and water bills. The society is also not giving NOC. What should I do and which lawyer should I contact?"
                      value={formData.issue||""}
                      onChange={e=>setField("issue",e.target.value)}
                    />
                  </div>
                  {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] text-red-700 font-medium">⚠️ {error}</div>}
                  <button
                    className="flex items-center justify-center gap-2 text-white font-semibold text-[15px] rounded-xl py-3.5 transition disabled:opacity-40 shadow-md hover:-translate-y-0.5 active:translate-y-0"
                    style={{background:"#1e293b"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#0f172a"}
                    onMouseLeave={e=>e.currentTarget.style.background="#1e293b"}
                    disabled={loading||(formData.issue||"").trim().length<10}
                    onClick={generate}
                  >
                    {loading ? <><span className="spin"/>{loadMsg}</> : "⚖️ Get Legal Guidance →"}
                  </button>
                </div>
              )}

              {/* ── AI Draft form ── */}
              {svc.aiDraft && svc.fields && (
                <div className="flex flex-col gap-4">
                  {/* AI banner */}
                  <div className="flex items-start gap-3 rounded-2xl p-4" style={{background:"#0f172a",border:"1px solid rgba(255,255,255,0.07)"}}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0" style={{background:"linear-gradient(135deg,#10b981,#0d9488)"}}>🤖</div>
                    <div>
                      <div className="text-[13px] font-bold mb-0.5" style={{color:"#ffffff"}}>Document Generator</div>
                      <p className="text-[12.5px] leading-relaxed" style={{color:"rgba(255,255,255,0.5)"}}>Fill in the details below and we'll generate a complete, legally formatted document ready to print on stamp paper.</p>
                    </div>
                  </div>

                  {/* Form card */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                      <span className="text-[13px] font-bold text-slate-600">Document Details</span>
                      <span className="text-[11.5px] text-slate-400">All fields required unless marked optional</span>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                      {svc.fields.map(f => (
                        <div key={f.id} className={f.type==="textarea"?"sm:col-span-2":""}>
                          <label className={LBL}>
                            {f.label}
                            {f.id==="special_terms" && <span className="text-slate-300 normal-case font-normal ml-1">(optional)</span>}
                          </label>
                          {f.type==="select" ? (
                            <select className={INPUT} value={formData[f.id]||""} onChange={e=>setField(f.id,e.target.value)}>
                              <option value="">Select…</option>
                              {f.options.map(o=><option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : f.type==="textarea" ? (
                            <textarea className={cn(INPUT,"min-h-[80px] resize-y leading-relaxed")} placeholder={f.placeholder||""} value={formData[f.id]||""} onChange={e=>setField(f.id,e.target.value)} />
                          ) : (
                            <input type={f.type} className={INPUT} placeholder={f.placeholder||""} value={formData[f.id]||""} onChange={e=>setField(f.id,e.target.value)} />
                          )}
                        </div>
                      ))}
                    </div>

                    {error && <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] text-red-700 font-medium">⚠️ {error}</div>}

                    <div className="px-6 pb-6 flex gap-3">
                      <button onClick={reset} className="border border-slate-200 hover:border-slate-400 text-slate-500 hover:text-slate-800 font-semibold text-[14px] rounded-xl px-5 py-3.5 transition">
                        ← Back
                      </button>
                      <button
                        className={cn("flex-1 flex items-center justify-center gap-2 text-white font-semibold text-[15px] rounded-xl py-3.5 transition disabled:opacity-40 shadow-lg hover:-translate-y-0.5 active:translate-y-0", th.btn)}
                        disabled={loading||!isReady()}
                        onClick={generate}
                      >
                        {loading ? <><span className="spin"/>{loadMsg}</> : `Generate ${svc.label} →`}
                      </button>
                    </div>
                  </div>

                  {/* Stamp paper notice */}
                  <div className="flex items-start gap-3.5 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-xl">📌</div>
                    <div>
                      <div className="text-[13px] font-bold text-amber-800 mb-1">Legal Validity Note</div>
                      <p className="text-[12.5px] text-amber-700 leading-relaxed">This is a draft document. For legal validity, print on appropriate stamp paper (₹100–₹500), get it signed by all parties, notarized, and registered at your local Sub-Registrar office.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════ RESULT VIEW ══════════ */}
          {view === "result" && svc && (
            <div className="max-w-[800px] mx-auto anim">

              {/* Success banner */}
              <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 mb-5" style={{background:"#0f172a",boxShadow:"0 20px 50px rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.08)"}}>
                <div className="absolute inset-0" style={{background:"radial-gradient(ellipse at top right, rgba(16,185,129,0.1), transparent 60%)"}} />
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{background:"linear-gradient(90deg,transparent,#10b981,transparent)"}} />
                <div className="relative z-10 flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:"rgba(16,185,129,0.2)",border:"1px solid rgba(16,185,129,0.35)"}}>
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{color:"#34d399"}}>
                      {svc.lawyerGuide ? "Legal Guidance" : "Document"} Ready
                    </div>
                    <h1 className="font-[Lora,serif] text-xl sm:text-2xl font-bold leading-tight" style={{color:"#ffffff"}}>
                      {svc.lawyerGuide ? "Your Legal Guidance Sheet" : `${svc.label} Generated`}
                    </h1>
                    <p className="text-[13px] mt-1" style={{color:"rgba(255,255,255,0.45)"}}>
                      {svc.lawyerGuide ? "Review the guidance below." : "Review, print or download your document."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action toolbar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3 mb-4 flex flex-wrap gap-2 shadow-sm">
                {!svc.lawyerGuide && (
                  <button onClick={doPrint} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[13.5px] rounded-xl px-4 py-2.5 transition shadow-md hover:-translate-y-0.5">
                    🖨️ Print
                  </button>
                )}
                <button onClick={doDownload} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-[13.5px] rounded-xl px-4 py-2.5 transition hover:-translate-y-0.5">
                  ⬇️ Download
                </button>
                <button onClick={doCopy} className={cn("flex items-center gap-2 font-semibold text-[13.5px] rounded-xl px-4 py-2.5 transition border",
                  copied ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "border-slate-200 hover:border-slate-400 text-slate-600 hover:bg-slate-50"
                )}>
                  {copied ? "✓ Copied!" : "📋 Copy Text"}
                </button>
                <button onClick={()=>{setView("service");setDocText("");setError("");}} className="flex items-center gap-2 border border-slate-200 hover:border-slate-400 text-slate-600 font-semibold text-[13.5px] rounded-xl px-4 py-2.5 transition hover:bg-slate-50">
                  ✏️ Edit
                </button>
                <button onClick={reset} className="flex items-center gap-2 border border-slate-200 hover:border-slate-400 text-slate-500 font-semibold text-[13.5px] rounded-xl px-4 py-2.5 transition hover:bg-slate-50 ml-auto">
                  ← All Services
                </button>
              </div>

              {/* Document viewer */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Doc header bar */}
                <div className={cn("flex items-center justify-between px-5 py-3 border-b", th.light, th.border)}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{svc.icon}</span>
                    <div>
                      <div className={cn("text-[13px] font-bold", th.text)}>{svc.label}</div>
                      <div className="text-[11px] text-slate-400">Legally formatted · For stamp paper use</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                </div>

                {/* Legal paper body */}
                <div style={{background:"#fffef8",borderLeft:"5px solid #1e293b"}}>
                  {/* Watermark strip */}
                  <div className="flex items-center justify-between px-6 py-2.5 border-b border-dashed border-slate-200" style={{background:"#f8f9fa"}}>
                    <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-[0.15em]">📄 Legal Document — Draft Copy</span>
                    <span className="text-[10.5px] text-slate-400">Print on Stamp Paper for Legal Use</span>
                  </div>

                  {/* Document content */}
                  <div className="px-8 sm:px-12 py-8">
                    <style>{`.doc-body { white-space:pre-wrap; font-family:'Times New Roman',Georgia,serif; font-size:13.5px; line-height:2; color:#1a1a1a; letter-spacing:0.01em; }`}</style>
                    <div className="doc-body">{docText}</div>
                  </div>

                  {/* Bottom stamp reminder */}
                  {!svc.lawyerGuide && (
                    <div className="mx-8 sm:mx-12 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {["Stamp Paper Value","Notary Seal","Registration Office"].map((label, i) => (
                        <div key={i} className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center" style={{minHeight:"90px"}}>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</div>
                          <div className="text-[11px] text-slate-300 italic">
                            {i === 0 ? "Affix stamp here" : i === 1 ? "Official seal here" : "Office stamp here"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Legal disclaimer */}
              <div className="mt-4 flex items-start gap-3.5 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">⚠️</div>
                <div>
                  <div className="text-[13px] font-bold text-amber-800 mb-1">Legal Disclaimer</div>
                  <p className="text-[12.5px] text-amber-700 leading-relaxed">This is a generated draft document for reference purposes only and does not constitute legal advice. For binding legal validity, consult a registered lawyer or advocate, print on stamp paper of the appropriate value, and register at the Sub-Registrar office where required by law.</p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}