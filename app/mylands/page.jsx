"use client";

import { useState, useEffect, useCallback } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

// ─── Firebase init ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

// ─── Dummy fallback data ──────────────────────────────────────────────────────
const DUMMY_LANDS = [
  {
    _id: "dummy_1",
    title: "Sunrise Valley Farm",
    location: "Nashik, Maharashtra",
    area: "4.5 acres",
    type: "Agricultural",
    status: "Verified",
    registeredOn: "2021-03-15",
    surveyNo: "SRV/2021/0432",
  },
  {
    _id: "dummy_2",
    title: "Hilltop Residential Plot",
    location: "Pune, Maharashtra",
    area: "1,200 sq ft",
    type: "Residential",
    status: "Pending",
    registeredOn: "2022-08-01",
    surveyNo: "SRV/2022/1198",
  },
  {
    _id: "dummy_3",
    title: "Riverside Commercial Land",
    location: "Aurangabad, Maharashtra",
    area: "0.8 acres",
    type: "Commercial",
    status: "Verified",
    registeredOn: "2023-01-20",
    surveyNo: "SRV/2023/0087",
  },
];

const EMPTY_FORM = { title: "", location: "", area: "", type: "Agricultural", surveyNo: "" };

const STATUS_STYLES = {
  Verified: { bg: "#e8f5ec", color: "#2d7a47", dot: "#2d7a47" },
  Pending:  { bg: "#fff8e6", color: "#b07d00", dot: "#f0a500" },
  Disputed: { bg: "#fdecea", color: "#c0392b", dot: "#e74c3c" },
};

const TYPE_ICON = {
  Agricultural: "🌾",
  Residential:  "🏡",
  Commercial:   "🏢",
  Industrial:   "🏭",
};

// ─── Build a new land object locally ─────────────────────────────────────────
function buildLocalLand(form, uid) {
  return {
    _id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: form.title.trim(),
    location: form.location.trim(),
    area: form.area.trim(),
    type: form.type,
    surveyNo: form.surveyNo.trim(),
    status: "Pending",
    registeredOn: new Date().toISOString().split("T")[0],
    uid: uid || "guest",
    _source: "local", // flag so we know it's client-only
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MyLandsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lands, setLands] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ── Auth listener ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // ── Fetch lands ──
  const fetchLands = useCallback(async (uid) => {
    setFetchLoading(true);
    setFetchError("");
    try {
      const res = await fetch(`/api/lands?uid=${uid}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setLands(data.length ? data : DUMMY_LANDS);
    } catch (err) {
      console.error(err);
      setFetchError("Could not reach server. Showing sample data.");
      setLands(DUMMY_LANDS);
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchLands(user.uid);
      } else {
        setLands(DUMMY_LANDS);
      }
    }
  }, [user, authLoading, fetchLands]);

  // ── Sign out ──
  const handleSignOut = async () => {
    await signOut(auth);
  };

  // ── Form helpers ──
  const handleFormChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const closeModal = () => {
    setShowAddModal(false);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  // ── Add land — tries API first, falls back to local insert ──
  const handleAddLand = async (e) => {
    e.preventDefault();
    setFormError("");

    // Validation
    if (!form.title.trim())    return setFormError("Property title is required.");
    if (!form.location.trim()) return setFormError("Location is required.");
    if (!form.area.trim())     return setFormError("Area is required.");
    if (!form.surveyNo.trim()) return setFormError("Survey number is required.");

    setSubmitting(true);

    const uid = user?.uid || "guest";
    const newLand = buildLocalLand(form, uid);

    // ── Try the API ──
    try {
      const res = await fetch("/api/lands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, uid, status: "Pending" }),
      });

      if (res.ok) {
        const saved = await res.json();
        // API worked — use the server's returned object
        setLands((prev) => [saved, ...prev]);
      } else {
        throw new Error("API responded with an error");
      }
    } catch (err) {
      // ── API unavailable — insert the locally-built land anyway ──
      console.warn("API unavailable, saving land locally:", err.message);
      setLands((prev) => [newLand, ...prev]);
    }

    // Either way — close modal and show success
    closeModal();
    setSuccessMsg("Land registered successfully!");
    setTimeout(() => setSuccessMsg(""), 3500);
    setSubmitting(false);
  };

  if (authLoading) return <FullscreenLoader />;

  const verified = lands.filter((l) => l.status === "Verified").length;
  const pending  = lands.filter((l) => l.status === "Pending").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --earth: #2c2416; --soil: #4a3728; --clay: #8b6545; --sand: #d4a96a;
          --cream: #f5ede0; --sky: #eef3ef; --moss: #4a7c59; --leaf: #6aab7a;
          --border: #ddd5c8; --white: #ffffff;
          --shadow: 0 2px 16px rgba(44,36,22,0.09);
        }

        body { background: var(--cream); font-family: 'DM Sans', sans-serif; color: var(--earth); }

        .ml-layout { min-height: 100vh; display: flex; flex-direction: column; }

        /* ── Header ── */
        .ml-header {
          background: var(--earth); padding: 0 2rem;
          display: flex; align-items: center; justify-content: space-between;
          height: 64px; position: sticky; top: 0; z-index: 100;
        }
        .ml-logo {
          display: flex; align-items: center; gap: 0.6rem;
          font-family: 'Playfair Display', serif;
          font-size: 1.3rem; font-weight: 900; color: var(--cream);
        }
        .ml-logo-mark {
          width: 32px; height: 32px; background: var(--sand); border-radius: 7px;
          display: flex; align-items: center; justify-content: center; font-size: 1rem;
        }
        .ml-header-right { display: flex; align-items: center; gap: 1rem; }
        .ml-user-pill {
          display: flex; align-items: center; gap: 0.5rem;
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 20px; padding: 0.3rem 0.8rem 0.3rem 0.35rem;
        }
        .ml-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--sand); color: var(--earth);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; font-weight: 600;
        }
        .ml-user-name { font-size: 0.85rem; color: var(--cream); font-weight: 500; }
        .ml-signout-btn {
          padding: 0.4rem 1rem; border: 1px solid rgba(255,255,255,0.2);
          background: transparent; border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-size: 0.82rem;
          color: rgba(245,237,224,0.7); cursor: pointer; transition: all 0.2s;
        }
        .ml-signout-btn:hover { background: rgba(255,255,255,0.08); color: var(--cream); }
        .ml-login-btn {
          padding: 0.4rem 1rem; border: 1px solid rgba(212,169,106,0.5);
          background: transparent; border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-size: 0.82rem;
          color: var(--sand); cursor: pointer; transition: all 0.2s;
        }
        .ml-login-btn:hover { background: rgba(212,169,106,0.12); }

        /* ── Main ── */
        .ml-main { flex: 1; max-width: 1200px; margin: 0 auto; width: 100%; padding: 2.5rem 2rem; }

        .ml-title-row {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;
        }
        .ml-page-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.8rem, 3vw, 2.4rem);
          font-weight: 900; color: var(--earth); line-height: 1.1;
        }
        .ml-page-title span { color: var(--moss); }
        .ml-page-sub { color: var(--clay); font-size: 0.9rem; margin-top: 0.3rem; font-weight: 300; }

        .ml-add-btn {
          display: flex; align-items: center; gap: 0.5rem;
          background: var(--moss); color: var(--white);
          border: none; border-radius: 10px; padding: 0.7rem 1.3rem;
          font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 500;
          cursor: pointer; transition: background 0.2s, transform 0.1s; white-space: nowrap;
          box-shadow: 0 2px 10px rgba(74,124,89,0.25);
        }
        .ml-add-btn:hover { background: #3d6b4a; }
        .ml-add-btn:active { transform: scale(0.98); }

        /* ── Stats ── */
        .ml-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
        .ml-stat-card {
          background: var(--white); border: 1px solid var(--border);
          border-radius: 14px; padding: 1.2rem 1.4rem; box-shadow: var(--shadow);
        }
        .ml-stat-label { font-size: 0.78rem; font-weight: 500; color: var(--clay); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem; }
        .ml-stat-value { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 700; color: var(--earth); line-height: 1; }

        /* ── Alerts ── */
        .ml-alert {
          padding: 0.8rem 1.2rem; border-radius: 10px; font-size: 0.88rem;
          margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.6rem;
        }
        .ml-alert-warn    { background: #fff8e6; border: 1px solid #f0d070; color: #7a5800; }
        .ml-alert-success { background: #e8f5ec; border: 1px solid #a8d5b5; color: #2d7a47; }
        .ml-alert-info    { background: #eef4ff; border: 1px solid #b0c8f0; color: #1a3a7a; }

        /* ── Grid ── */
        .ml-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.2rem; }

        /* ── Land card ── */
        .ml-card {
          background: var(--white); border: 1px solid var(--border);
          border-radius: 16px; overflow: hidden; box-shadow: var(--shadow);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .ml-card:hover { transform: translateY(-3px); box-shadow: 0 6px 24px rgba(44,36,22,0.13); }
        .ml-card-accent { height: 6px; }
        .ml-card-body { padding: 1.3rem 1.4rem; }
        .ml-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.8rem; }
        .ml-card-icon {
          width: 44px; height: 44px; border-radius: 11px; background: var(--sky);
          display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0;
        }
        .ml-card-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; color: var(--earth); margin-bottom: 0.2rem; line-height: 1.3; }
        .ml-card-location { font-size: 0.82rem; color: var(--clay); }
        .ml-status-badge {
          display: inline-flex; align-items: center; gap: 0.35rem;
          padding: 0.25rem 0.7rem; border-radius: 20px;
          font-size: 0.76rem; font-weight: 600; white-space: nowrap; flex-shrink: 0;
        }
        .ml-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .ml-card-divider { height: 1px; background: var(--border); margin: 0.9rem 0; }
        .ml-card-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        .ml-meta-key { font-size: 0.72rem; color: var(--clay); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.15rem; }
        .ml-meta-val { font-size: 0.88rem; font-weight: 500; color: var(--earth); }
        .ml-card-footer {
          padding: 0.8rem 1.4rem; border-top: 1px solid var(--border);
          display: flex; justify-content: space-between; align-items: center; background: #faf7f3;
        }
        .ml-local-tag { font-size: 0.72rem; color: var(--clay); font-style: italic; }
        .ml-view-btn {
          font-size: 0.82rem; font-weight: 500; color: var(--moss);
          background: none; border: none; cursor: pointer; padding: 0.2rem 0;
          display: flex; align-items: center; gap: 0.3rem; transition: gap 0.15s;
        }
        .ml-view-btn:hover { gap: 0.5rem; }

        /* ── Empty state ── */
        .ml-empty { grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: var(--clay); }
        .ml-empty-icon { font-size: 3.5rem; margin-bottom: 1rem; }
        .ml-empty h3 { font-family: 'Playfair Display', serif; font-size: 1.4rem; color: var(--earth); margin-bottom: 0.5rem; }
        .ml-empty p { font-size: 0.9rem; font-weight: 300; }

        /* ── Skeleton ── */
        .ml-skeleton { background: var(--white); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; height: 220px; }
        .ml-skel-shine {
          background: linear-gradient(90deg, #f0ebe3 25%, #e8e0d5 50%, #f0ebe3 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite; height: 100%;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* ── Modal ── */
        .ml-overlay {
          position: fixed; inset: 0; background: rgba(30,22,12,0.55);
          backdrop-filter: blur(3px); z-index: 200;
          display: flex; align-items: center; justify-content: center; padding: 1rem;
        }
        .ml-modal {
          background: var(--white); border-radius: 20px;
          width: 100%; max-width: 480px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25); overflow: hidden;
          animation: slideUp 0.25s ease;
        }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        .ml-modal-header {
          padding: 1.5rem 1.8rem 1rem; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .ml-modal-title { font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 700; color: var(--earth); }
        .ml-close-btn {
          width: 30px; height: 30px; border-radius: 8px; border: none;
          background: var(--sky); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem; color: var(--clay); transition: background 0.15s;
        }
        .ml-close-btn:hover { background: var(--border); }

        .ml-modal-body { padding: 1.5rem 1.8rem; }

        .ml-field { margin-bottom: 1rem; }
        .ml-label {
          display: block; font-size: 0.78rem; font-weight: 500; color: var(--soil);
          text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.35rem;
        }
        .ml-input, .ml-select {
          width: 100%; padding: 0.75rem 1rem;
          border: 1.5px solid var(--border); background: var(--cream);
          border-radius: 10px; font-family: 'DM Sans', sans-serif;
          font-size: 0.92rem; color: var(--earth); outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
        }
        .ml-input::placeholder { color: #b0a090; }
        .ml-input:focus, .ml-select:focus {
          border-color: var(--moss);
          box-shadow: 0 0 0 3px rgba(74,124,89,0.12);
          background: var(--white);
        }
        .ml-select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238b6545' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; cursor: pointer; }

        .ml-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }

        .ml-modal-error {
          background: #fdf0ef; border: 1px solid #f0b8b4;
          border-radius: 8px; padding: 0.7rem 1rem;
          font-size: 0.84rem; color: #c0392b; margin-bottom: 0.8rem;
          display: flex; align-items: center; gap: 0.5rem;
        }

        .ml-modal-footer { padding: 1rem 1.8rem 1.5rem; display: flex; gap: 0.8rem; justify-content: flex-end; }
        .ml-cancel-btn {
          padding: 0.65rem 1.2rem; border: 1.5px solid var(--border); background: transparent;
          border-radius: 9px; font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem; color: var(--clay); cursor: pointer; transition: border-color 0.15s;
        }
        .ml-cancel-btn:hover { border-color: var(--clay); }
        .ml-save-btn {
          padding: 0.65rem 1.4rem; background: var(--moss); color: var(--white);
          border: none; border-radius: 9px; font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem; font-weight: 500; cursor: pointer;
          transition: background 0.2s; display: flex; align-items: center; gap: 0.5rem;
          box-shadow: 0 2px 8px rgba(74,124,89,0.25);
        }
        .ml-save-btn:hover:not(:disabled) { background: #3d6b4a; }
        .ml-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .ml-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
          border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
          .ml-main { padding: 1.5rem 1rem; }
          .ml-stats { grid-template-columns: 1fr 1fr; }
          .ml-stats .ml-stat-card:last-child { grid-column: 1 / -1; }
          .ml-grid { grid-template-columns: 1fr; }
          .ml-grid-2 { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="ml-layout">
        {/* ── Header ── */}
        <header className="ml-header">
          <div className="ml-logo">
            <div className="ml-logo-mark">🌿</div>
            LandSure
          </div>
          <div className="ml-header-right">
            {user ? (
              <>
                <div className="ml-user-pill">
                  <div className="ml-avatar">
                    {user.photoURL
                      ? <img src={user.photoURL} width="28" height="28" style={{ borderRadius: "50%", objectFit: "cover" }} alt="" />
                      : initials(user.displayName || user.email)}
                  </div>
                  <span className="ml-user-name">{user.displayName || user.email?.split("@")[0]}</span>
                </div>
                <button className="ml-signout-btn" onClick={handleSignOut}>Sign out</button>
              </>
            ) : (
              <button className="ml-login-btn" onClick={() => router.push("/login")}>Sign In</button>
            )}
          </div>
        </header>

        <main className="ml-main">
          {/* ── Title row ── */}
          <div className="ml-title-row">
            <div>
              <h1 className="ml-page-title">My <span>Lands</span></h1>
              <p className="ml-page-sub">
                {user
                  ? "All properties registered under your account."
                  : "Browsing as guest — sign in to save your lands."}
              </p>
            </div>
            <button className="ml-add-btn" onClick={() => setShowAddModal(true)}>
              <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M8 3v10M3 8h10"/>
              </svg>
              Add Land
            </button>
          </div>

          {/* ── Alerts ── */}
          {!user && (
            <div className="ml-alert ml-alert-info">
              🌿 Browsing as guest.{" "}
              <span style={{ fontWeight: 600, cursor: "pointer", textDecoration: "underline" }} onClick={() => router.push("/login")}>
                Sign in
              </span>{" "}
              to save and manage your own lands.
            </div>
          )}
          {fetchError && <div className="ml-alert ml-alert-warn">⚠️ {fetchError}</div>}
          {successMsg && <div className="ml-alert ml-alert-success">✅ {successMsg}</div>}

          {/* ── Stats ── */}
          {!fetchLoading && (
            <div className="ml-stats">
              <div className="ml-stat-card">
                <div className="ml-stat-label">Total Lands</div>
                <div className="ml-stat-value">{lands.length}</div>
              </div>
              <div className="ml-stat-card">
                <div className="ml-stat-label">Verified</div>
                <div className="ml-stat-value" style={{ color: "var(--moss)" }}>{verified}</div>
              </div>
              <div className="ml-stat-card">
                <div className="ml-stat-label">Pending</div>
                <div className="ml-stat-value" style={{ color: "#b07d00" }}>{pending}</div>
              </div>
            </div>
          )}

          {/* ── Land grid ── */}
          <div className="ml-grid">
            {fetchLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="ml-skeleton"><div className="ml-skel-shine" /></div>
                ))
              : lands.length === 0
              ? (
                <div className="ml-empty">
                  <div className="ml-empty-icon">🗺️</div>
                  <h3>No lands registered yet</h3>
                  <p>Click "Add Land" to register your first property.</p>
                </div>
              )
              : lands.map((land) => <LandCard key={land._id} land={land} />)
            }
          </div>
        </main>
      </div>

      {/* ── Add Land Modal ── */}
      {showAddModal && (
        <div className="ml-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="ml-modal">
            <div className="ml-modal-header">
              <h2 className="ml-modal-title">Register New Land</h2>
              <button className="ml-close-btn" onClick={closeModal} type="button">✕</button>
            </div>

            <form onSubmit={handleAddLand} noValidate>
              <div className="ml-modal-body">
                {formError && (
                  <div className="ml-modal-error">
                    <span>⚠️</span> {formError}
                  </div>
                )}

                <div className="ml-field">
                  <label className="ml-label" htmlFor="title">Property Title</label>
                  <input
                    id="title" className="ml-input" name="title"
                    value={form.title} onChange={handleFormChange}
                    placeholder="e.g. Sunrise Valley Farm"
                    autoComplete="off"
                  />
                </div>

                <div className="ml-field">
                  <label className="ml-label" htmlFor="location">Location</label>
                  <input
                    id="location" className="ml-input" name="location"
                    value={form.location} onChange={handleFormChange}
                    placeholder="City, State"
                    autoComplete="off"
                  />
                </div>

                <div className="ml-grid-2">
                  <div className="ml-field">
                    <label className="ml-label" htmlFor="area">Area</label>
                    <input
                      id="area" className="ml-input" name="area"
                      value={form.area} onChange={handleFormChange}
                      placeholder="e.g. 2.5 acres"
                    />
                  </div>
                  <div className="ml-field">
                    <label className="ml-label" htmlFor="type">Type</label>
                    <select
                      id="type" className="ml-select" name="type"
                      value={form.type} onChange={handleFormChange}
                    >
                      <option>Agricultural</option>
                      <option>Residential</option>
                      <option>Commercial</option>
                      <option>Industrial</option>
                    </select>
                  </div>
                </div>

                <div className="ml-field">
                  <label className="ml-label" htmlFor="surveyNo">Survey Number</label>
                  <input
                    id="surveyNo" className="ml-input" name="surveyNo"
                    value={form.surveyNo} onChange={handleFormChange}
                    placeholder="e.g. SRV/2024/0001"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="ml-modal-footer">
                <button type="button" className="ml-cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="ml-save-btn" disabled={submitting}>
                  {submitting && <div className="ml-spinner" />}
                  {submitting ? "Saving…" : "🌱 Save Land"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─── LandCard ─────────────────────────────────────────────────────────────────

function LandCard({ land }) {
  const s = STATUS_STYLES[land.status] || STATUS_STYLES.Pending;
  const icon = TYPE_ICON[land.type] || "🏞️";
  const accentColor =
    land.status === "Verified" ? "var(--moss)"
    : land.status === "Disputed" ? "#e74c3c"
    : "var(--sand)";

  return (
    <div className="ml-card">
      <div className="ml-card-accent" style={{ background: accentColor }} />
      <div className="ml-card-body">
        <div className="ml-card-header">
          <div style={{ display: "flex", gap: "0.8rem", alignItems: "flex-start" }}>
            <div className="ml-card-icon">{icon}</div>
            <div>
              <div className="ml-card-title">{land.title}</div>
              <div className="ml-card-location">📍 {land.location}</div>
            </div>
          </div>
          <div className="ml-status-badge" style={{ background: s.bg, color: s.color }}>
            <span className="ml-status-dot" style={{ background: s.dot }} />
            {land.status}
          </div>
        </div>

        <div className="ml-card-divider" />

        <div className="ml-card-meta">
          <div>
            <div className="ml-meta-key">Area</div>
            <div className="ml-meta-val">{land.area}</div>
          </div>
          <div>
            <div className="ml-meta-key">Type</div>
            <div className="ml-meta-val">{land.type}</div>
          </div>
          <div>
            <div className="ml-meta-key">Survey No.</div>
            <div className="ml-meta-val">{land.surveyNo}</div>
          </div>
          <div>
            <div className="ml-meta-key">Registered</div>
            <div className="ml-meta-val">{formatDate(land.registeredOn)}</div>
          </div>
        </div>
      </div>

      <div className="ml-card-footer">
        {land._source === "local" && (
          <span className="ml-local-tag">📋 Saved locally</span>
        )}
        <button className="ml-view-btn">View Details →</button>
      </div>
    </div>
  );
}

// ─── FullscreenLoader ─────────────────────────────────────────────────────────

function FullscreenLoader() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#f5ede0", fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid #d4a96a", borderTopColor: "#4a7c59",
          animation: "spin 0.8s linear infinite", margin: "0 auto 1rem",
        }} />
        <p style={{ color: "#8b6545", fontSize: "0.9rem" }}>Loading your dashboard…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(str = "") {
  return str.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U";
}

function formatDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}