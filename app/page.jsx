"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import VoiceChatbot from '@/components/Chatbot';

const stats = [
  { value: "12K+", label: "Lands Verified" },
  { value: "98%", label: "Accuracy Rate" },
  { value: "3min", label: "Avg. Verify Time" },
  { value: "50+", label: "Districts Covered" },
];

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
      </svg>
    ),
    title: "Smart Land Search",
    desc: "Search across districts, plot numbers, and owner names with lightning-fast fuzzy matching.",
    href: "/search",
    color: "#4ade80",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
    title: "Document Service",
    desc: "A document generation service that allows users to easily create legally structured NOC certificates, sale deeds, and rental agreements online.",
    href: "/docu",
    color: "#60a5fa",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
    title: "Instant Verification",
    desc: "Cross-reference ownership, encumbrances, and title chains in seconds — not days.",
    href: "/verify",
    color: "#f59e0b",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
      </svg>
    ),
    title: "Document Vault",
    desc: "Store all your land records, sale deeds, and certificates in one secure, searchable vault.",
    href: "/documents",
    color: "#a78bfa",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    title: "My Lands Dashboard",
    desc: "Track all your registered properties, pending verifications, and document status at a glance.",
    href: "/mylands",
    color: "#fb7185",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
    title: "Add New Land",
    desc: "Register a new land parcel with all legal details, location coordinates, and ownership proof.",
    href: "/add-land",
    color: "#34d399",
  },
];

const steps = [
  { num: "01", title: "Create Account", desc: "Sign up with your Aadhaar-linked mobile number for secure identity verification." },
  { num: "02", title: "Search or Add Land", desc: "Look up existing plots by survey number or register a new land parcel." },
  { num: "03", title: "Upload Documents", desc: "Submit sale deeds, mutation records, and any encumbrance certificates." },
  { num: "04", title: "Get Verified", desc: "Receive a tamper-proof verification report within minutes." },
];

export default function HomePage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #080c12;
          --surface: #0e1420;
          --surface2: #141b28;
          --border: rgba(255,255,255,0.07);
          --accent: #4ade80;
          --accent2: #22c55e;
          --text: #e8edf5;
          --muted: #6b7a96;
          --font-head: 'Syne', sans-serif;
          --font-body: 'DM Sans', sans-serif;
        }

        body { background: var(--bg); color: var(--text); font-family: var(--font-body); }

        .page-wrap { min-height: 100vh; overflow-x: hidden; }

        /* HERO */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          overflow: hidden;
          padding: 120px 24px 80px;
        }
        .hero-bg {
          position: absolute; inset: 0; z-index: 0;
          background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(74,222,128,0.12) 0%, transparent 70%),
                      radial-gradient(ellipse 40% 50% at 80% 60%, rgba(96,165,250,0.06) 0%, transparent 60%),
                      var(--bg);
        }
        .hero-grid {
          position: absolute; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 70% 80% at 50% 50%, black 30%, transparent 80%);
        }
        .hero-orb {
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 70%);
          pointer-events: none;
          transition: transform 0.1s ease;
          z-index: 0;
        }
        .hero-inner {
          position: relative; z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        @media (max-width: 900px) {
          .hero-inner { grid-template-columns: 1fr; text-align: center; }
          .hero-actions { justify-content: center; }
          .hero-visual { display: none; }
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.25);
          color: var(--accent);
          padding: 6px 16px; border-radius: 100px;
          font-family: var(--font-body); font-size: 13px; font-weight: 500;
          letter-spacing: 0.02em; margin-bottom: 24px;
          animation: fadeUp 0.6s ease both;
        }
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        .hero-title {
          font-family: var(--font-head);
          font-size: clamp(42px, 5.5vw, 76px);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: #fff;
          margin-bottom: 24px;
          animation: fadeUp 0.6s 0.1s ease both;
        }
        .hero-title .accent { color: var(--accent); }
        .hero-title .thin { font-weight: 400; color: var(--muted); }

        .hero-desc {
          font-size: 17px; line-height: 1.7; color: var(--muted);
          max-width: 480px; margin-bottom: 40px;
          animation: fadeUp 0.6s 0.2s ease both;
        }
        .hero-actions {
          display: flex; gap: 16px; flex-wrap: wrap;
          animation: fadeUp 0.6s 0.3s ease both;
        }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent); color: #041a0a;
          padding: 14px 28px; border-radius: 12px;
          font-family: var(--font-head); font-weight: 700; font-size: 15px;
          text-decoration: none; transition: all 0.2s;
          box-shadow: 0 0 30px rgba(74,222,128,0.3);
        }
        .btn-primary:hover { background: var(--accent2); transform: translateY(-2px); box-shadow: 0 0 40px rgba(74,222,128,0.4); }
        .btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: var(--text);
          padding: 14px 28px; border-radius: 12px;
          border: 1px solid var(--border);
          font-family: var(--font-head); font-weight: 600; font-size: 15px;
          text-decoration: none; transition: all 0.2s;
        }
        .btn-secondary:hover { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04); transform: translateY(-2px); }

        /* HERO VISUAL */
        .hero-visual {
          position: relative; display: flex; justify-content: center;
          animation: fadeUp 0.8s 0.3s ease both;
        }
        .hero-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px; padding: 28px;
          width: 340px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.5);
          position: relative;
        }
        .hero-card::before {
          content: ''; position: absolute; inset: 0; border-radius: 20px;
          background: linear-gradient(135deg, rgba(74,222,128,0.05) 0%, transparent 60%);
          pointer-events: none;
        }
        .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .card-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(74,222,128,0.15); display: flex; align-items: center; justify-content: center; color: var(--accent); }
        .card-title { font-family: var(--font-head); font-weight: 700; font-size: 15px; color: #fff; }
        .card-sub { font-size: 12px; color: var(--muted); }
        .card-field { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 12px 16px; margin-bottom: 10px; }
        .field-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 4px; }
        .field-val { font-family: var(--font-head); font-size: 14px; font-weight: 600; color: var(--text); }
        .card-status {
          display: flex; align-items: center; gap: 8px; margin-top: 16px;
          background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.2);
          border-radius: 10px; padding: 10px 14px;
        }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); flex-shrink: 0; animation: pulse 2s infinite; }
        .status-text { font-size: 13px; color: var(--accent); font-weight: 500; }

        /* STATS */
        .stats-section {
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 40px 24px;
          background: var(--surface);
        }
        .stats-inner {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
        }
        @media (max-width: 700px) { .stats-inner { grid-template-columns: repeat(2,1fr); } }
        .stat-item {
          text-align: center; padding: 20px;
          border-right: 1px solid var(--border);
        }
        .stat-item:last-child { border-right: none; }
        .stat-val { font-family: var(--font-head); font-size: 40px; font-weight: 800; color: var(--accent); line-height: 1; }
        .stat-label { font-size: 13px; color: var(--muted); margin-top: 6px; }

        /* SECTION COMMON */
        .section { padding: 100px 24px; }
        .section-inner { max-width: 1200px; margin: 0 auto; }
        .section-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em;
          color: var(--accent); font-weight: 600; margin-bottom: 16px;
        }
        .section-title {
          font-family: var(--font-head); font-size: clamp(32px, 4vw, 52px);
          font-weight: 800; line-height: 1.1; letter-spacing: -0.025em;
          color: #fff; margin-bottom: 16px;
        }
        .section-desc { font-size: 16px; color: var(--muted); max-width: 500px; line-height: 1.7; }

        /* FEATURES GRID */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px; margin-top: 60px;
        }
        @media (max-width: 900px) { .features-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 600px) { .features-grid { grid-template-columns: 1fr; } }
        .feature-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 28px;
          text-decoration: none; color: inherit;
          transition: all 0.25s; display: block;
          position: relative; overflow: hidden;
        }
        .feature-card::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.02));
          opacity: 0; transition: opacity 0.25s;
        }
        .feature-card:hover { border-color: rgba(255,255,255,0.14); transform: translateY(-4px); box-shadow: 0 20px 50px rgba(0,0,0,0.4); }
        .feature-card:hover::after { opacity: 1; }
        .feature-icon {
          width: 52px; height: 52px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px; background: rgba(255,255,255,0.05);
          transition: background 0.25s;
        }
        .feature-card:hover .feature-icon { background: rgba(255,255,255,0.08); }
        .feature-name {
          font-family: var(--font-head); font-size: 17px; font-weight: 700;
          color: #fff; margin-bottom: 10px;
        }
        .feature-desc { font-size: 14px; color: var(--muted); line-height: 1.6; }
        .feature-arrow {
          margin-top: 20px; display: flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600; transition: gap 0.2s;
        }
        .feature-card:hover .feature-arrow { gap: 10px; }

        /* HOW IT WORKS */
        .how-section { padding: 100px 24px; background: var(--surface); }
        .steps-grid {
          display: grid; grid-template-columns: repeat(4,1fr); gap: 24px;
          margin-top: 60px; position: relative;
        }
        .steps-grid::before {
          content: ''; position: absolute; top: 28px; left: 10%; right: 10%; height: 1px;
          background: linear-gradient(90deg, transparent, var(--border), var(--border), transparent);
          z-index: 0;
        }
        @media (max-width: 900px) { .steps-grid { grid-template-columns: repeat(2,1fr); } .steps-grid::before { display: none; } }
        @media (max-width: 500px) { .steps-grid { grid-template-columns: 1fr; } }
        .step-card { text-align: center; position: relative; z-index: 1; }
        .step-num {
          width: 56px; height: 56px; border-radius: 50%;
          border: 1px solid var(--border); background: var(--bg);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-head); font-size: 14px; font-weight: 800;
          color: var(--accent); margin: 0 auto 20px; letter-spacing: 0;
        }
        .step-title { font-family: var(--font-head); font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 10px; }
        .step-desc { font-size: 13px; color: var(--muted); line-height: 1.6; }

        /* CTA */
        .cta-section { padding: 100px 24px; }
        .cta-box {
          max-width: 800px; margin: 0 auto; text-align: center;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 28px; padding: 70px 40px;
          position: relative; overflow: hidden;
        }
        .cta-box::before {
          content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 400px; height: 200px;
          background: radial-gradient(ellipse, rgba(74,222,128,0.12) 0%, transparent 70%);
        }
        .cta-title {
          font-family: var(--font-head); font-size: clamp(30px,4vw,52px);
          font-weight: 800; letter-spacing: -0.025em; color: #fff;
          margin-bottom: 16px; position: relative; z-index: 1;
        }
        .cta-desc { font-size: 16px; color: var(--muted); margin-bottom: 36px; position: relative; z-index: 1; }
        .cta-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; position: relative; z-index: 1; }

        /* FOOTER */
        footer {
          border-top: 1px solid var(--border);
          padding: 40px 24px;
          background: var(--surface);
        }
        .footer-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
        }
        .footer-logo { font-family: var(--font-head); font-weight: 800; font-size: 18px; color: #fff; }
        .footer-logo span { color: var(--accent); }
        .footer-links { display: flex; gap: 24px; }
        .footer-links a { font-size: 13px; color: var(--muted); text-decoration: none; transition: color 0.2s; }
        .footer-links a:hover { color: var(--text); }
        .footer-copy { font-size: 12px; color: var(--muted); }
      `}</style>

      <div className="page-wrap">
        <Navbar />

        {/* HERO */}
        <section className="hero" ref={heroRef}>
          <div className="hero-bg" />
          <div className="hero-grid" />
          <div
            className="hero-orb"
            style={{
              left: `calc(${mousePos.x}% - 300px)`,
              top: `calc(${mousePos.y}% - 300px)`,
            }}
          />
          <div className="hero-inner">
            <div>
              <div className="hero-badge">
                <span className="badge-dot" />
                Trusted Land Verification Platform
              </div>
              <h1 className="hero-title">
                Verify Land.<br />
                <span className="accent">Secure</span> Ownership.<br />
                <span className="thin">Sleep Easy.</span>
              </h1>
              <p className="hero-desc">
                LandSure gives you instant access to verified land records, AI-powered document scanning, and tamper-proof ownership certificates — all in one place.
              </p>
              <div className="hero-actions">
                <Link href="/search" className="btn-primary">
                  Search Land Records
                  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
                    <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link href="/login" className="btn-secondary">
                  Get Started Free
                </Link>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-card">
                <div className="card-header">
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                    </svg>
                  </div>
                  <div>
                    <div className="card-title">Land Verification</div>
                    <div className="card-sub">Survey No. MH-PN-2247-B</div>
                  </div>
                </div>
                <div className="card-field">
                  <div className="field-label">Owner Name</div>
                  <div className="field-val">Rajesh Kumar Sharma</div>
                </div>
                <div className="card-field">
                  <div className="field-label">Area</div>
                  <div className="field-val">2.4 Acres — Pune, Maharashtra</div>
                </div>
                <div className="card-field">
                  <div className="field-label">Title Status</div>
                  <div className="field-val">Clear — No Encumbrances</div>
                </div>
                <div className="card-status">
                  <div className="status-dot" />
                  <div className="status-text">Verified & Certified ✓</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <div className="stats-section">
          <div className="stats-inner">
            {stats.map((s) => (
              <div key={s.label} className="stat-item">
                <div className="stat-val">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <section className="section">
          <div className="section-inner">
            <div className="section-tag">
              <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, height: 12 }}>
                <circle cx="8" cy="8" r="8" />
              </svg>
              Platform Features
            </div>
            <h2 className="section-title">
              Everything land.<br />Nothing else.
            </h2>
            <p className="section-desc">
              From searching public records to scanning private documents, LandSure handles the full land verification lifecycle.
            </p>
            <div className="features-grid">
              {features.map((f) => (
                <Link key={f.title} href={f.href} className="feature-card">
                  <div className="feature-icon" style={{ color: f.color }}>
                    {f.icon}
                  </div>
                  <div className="feature-name">{f.title}</div>
                  <div className="feature-desc">{f.desc}</div>
                  <div className="feature-arrow" style={{ color: f.color }}>
                    <span>Explore</span>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M8 3l5 5-5 5" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="how-section">
          <div className="section-inner">
            <div className="section-tag">
              <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, height: 12 }}>
                <circle cx="8" cy="8" r="8" />
              </svg>
              Process
            </div>
            <h2 className="section-title">How LandSure works</h2>
            <p className="section-desc">Get a verified land report in four simple steps — no paperwork, no queues.</p>
            <div className="steps-grid">
              {steps.map((s) => (
                <div key={s.num} className="step-card">
                  <div className="step-num">{s.num}</div>
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="section-inner">
            <div className="cta-box">
              <h2 className="cta-title">Ready to verify your land?</h2>
              <p className="cta-desc">Join thousands of landowners and buyers who trust LandSure for accurate, instant records.</p>
              <div className="cta-actions">
                <Link href="/login" className="btn-primary">
                  Create Free Account
                </Link>
                <Link href="/search" className="btn-secondary">
                  Search Records
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer>
          <div className="footer-inner">
            <div className="footer-logo">Land<span>Sure</span></div>
            <div className="footer-links">
              <Link href="/search">Search</Link>
              <Link href="/verify">Verify</Link>
              <Link href="/documents">Documents</Link>
              <Link href="/dashboard">Dashboard</Link>
            </div>
            <div className="footer-copy">© 2024 LandSure. All rights reserved.</div>
          </div>
        </footer>
        <VoiceChatbot/>
      </div>
    </>
  );
}