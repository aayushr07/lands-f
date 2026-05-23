"use client";

import { useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { useRouter } from "next/navigation";

// ─── Firebase config ──────────────────────────────────────────────────────────
// Replace these with your actual Firebase project values
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
const googleProvider = new GoogleAuthProvider();

// ─── Component ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const clearError = () => setError("");

  // ── Email / Password ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "register" && password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push("/mylands");
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  // ── Google SSO ──
  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/mylands");
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --earth: #2c2416;
          --soil: #4a3728;
          --clay: #8b6545;
          --sand: #d4a96a;
          --cream: #f5ede0;
          --sky: #e8f0ea;
          --moss: #4a7c59;
          --leaf: #6aab7a;
          --error: #c0392b;
          --white: #ffffff;
        }

        .ls-login-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'DM Sans', sans-serif;
          background: var(--cream);
        }

        /* ── Left panel ── */
        .ls-panel-left {
          position: relative;
          background: var(--earth);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 3rem;
        }

        .ls-panel-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 20% 80%, rgba(74,124,89,0.35) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 10%, rgba(139,101,69,0.4) 0%, transparent 50%);
        }

        .ls-topography {
          position: absolute;
          inset: 0;
          opacity: 0.06;
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 28px,
            rgba(212,169,106,0.8) 28px,
            rgba(212,169,106,0.8) 29px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 28px,
            rgba(212,169,106,0.8) 28px,
            rgba(212,169,106,0.8) 29px
          );
        }

        .ls-brand {
          position: relative;
          z-index: 2;
        }

        .ls-brand-mark {
          width: 52px;
          height: 52px;
          background: var(--sand);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2.5rem;
          font-family: 'Playfair Display', serif;
          font-size: 1.6rem;
          font-weight: 900;
          color: var(--earth);
        }

        .ls-brand-heading {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 3.5vw, 3rem);
          font-weight: 900;
          color: var(--cream);
          line-height: 1.1;
          margin-bottom: 1.2rem;
        }

        .ls-brand-heading span {
          color: var(--sand);
        }

        .ls-brand-sub {
          color: rgba(245,237,224,0.6);
          font-size: 0.95rem;
          font-weight: 300;
          line-height: 1.7;
          max-width: 340px;
        }

        .ls-dots {
          position: absolute;
          top: 2rem;
          right: 2rem;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 6px;
          opacity: 0.15;
        }

        .ls-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--sand);
        }

        /* ── Right panel ── */
        .ls-panel-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: var(--cream);
        }

        .ls-form-card {
          width: 100%;
          max-width: 420px;
        }

        .ls-form-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.9rem;
          font-weight: 700;
          color: var(--earth);
          margin-bottom: 0.4rem;
        }

        .ls-form-subtitle {
          color: var(--clay);
          font-size: 0.9rem;
          margin-bottom: 2rem;
        }

        /* Tabs */
        .ls-tabs {
          display: flex;
          background: var(--sky);
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 2rem;
        }

        .ls-tab {
          flex: 1;
          padding: 0.6rem;
          border: none;
          background: transparent;
          border-radius: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--clay);
          cursor: pointer;
          transition: all 0.2s;
        }

        .ls-tab.active {
          background: var(--white);
          color: var(--earth);
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }

        /* Google btn */
        .ls-google-btn {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1.5px solid #d6cfc6;
          background: var(--white);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.7rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.92rem;
          font-weight: 500;
          color: var(--earth);
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
          margin-bottom: 1.2rem;
        }

        .ls-google-btn:hover {
          border-color: var(--clay);
          box-shadow: 0 2px 8px rgba(0,0,0,0.07);
        }

        .ls-divider {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin-bottom: 1.2rem;
          color: var(--clay);
          font-size: 0.8rem;
        }

        .ls-divider::before,
        .ls-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #d6cfc6;
        }

        /* Form fields */
        .ls-field {
          margin-bottom: 1rem;
        }

        .ls-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--soil);
          margin-bottom: 0.4rem;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .ls-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1.5px solid #d6cfc6;
          background: var(--white);
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.93rem;
          color: var(--earth);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .ls-input:focus {
          border-color: var(--moss);
          box-shadow: 0 0 0 3px rgba(74,124,89,0.12);
        }

        /* Error */
        .ls-error {
          background: #fdf0ef;
          border: 1px solid #f0b8b4;
          border-radius: 8px;
          padding: 0.7rem 1rem;
          font-size: 0.85rem;
          color: var(--error);
          margin-bottom: 1rem;
        }

        /* Submit */
        .ls-submit {
          width: 100%;
          padding: 0.85rem;
          background: var(--earth);
          color: var(--cream);
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          margin-top: 0.5rem;
          letter-spacing: 0.01em;
        }

        .ls-submit:hover {
          background: var(--soil);
        }

        .ls-submit:active { transform: scale(0.99); }

        .ls-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Spinner */
        .ls-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(245,237,224,0.4);
          border-top-color: var(--cream);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
          margin-right: 6px;
          vertical-align: middle;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer note */
        .ls-footer-note {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.8rem;
          color: var(--clay);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .ls-login-root { grid-template-columns: 1fr; }
          .ls-panel-left { display: none; }
        }
      `}</style>

      <div className="ls-login-root">
        {/* ── Left panel ── */}
        <div className="ls-panel-left">
          <div className="ls-topography" />
          <div className="ls-dots">
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="ls-dot" />
            ))}
          </div>
          <div className="ls-brand">
            <div className="ls-brand-mark">L</div>
            <h1 className="ls-brand-heading">
              Your land.<br />
              <span>Secured &amp; mapped.</span>
            </h1>
            <p className="ls-brand-sub">
              LandSure gives every landowner a single dashboard to register,
              manage, and protect their property — all in one place.
            </p>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="ls-panel-right">
          <div className="ls-form-card">
            <h2 className="ls-form-title">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="ls-form-subtitle">
              {mode === "login"
                ? "Sign in to access your land dashboard."
                : "Register to start managing your lands."}
            </p>

            {/* Tabs */}
            <div className="ls-tabs">
              <button
                className={`ls-tab ${mode === "login" ? "active" : ""}`}
                onClick={() => { setMode("login"); clearError(); }}
              >
                Sign In
              </button>
              <button
                className={`ls-tab ${mode === "register" ? "active" : ""}`}
                onClick={() => { setMode("register"); clearError(); }}
              >
                Register
              </button>
            </div>

            {/* Google */}
            <button className="ls-google-btn" onClick={handleGoogle} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.2 0 24 0 14.8 0 6.9 5.4 3 13.3l7.8 6C12.7 13.1 17.9 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
                <path fill="#FBBC05" d="M10.8 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.7-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l8.2-6.1z"/>
                <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2.1 1.4-4.7 2.2-7.7 2.2-6.1 0-11.3-3.6-13.2-8.8l-8.2 6.1C6.9 42.6 14.8 48 24 48z"/>
              </svg>
              Continue with Google
            </button>

            <div className="ls-divider">or with email</div>

            {error && <div className="ls-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="ls-field">
                <label className="ls-label">Email</label>
                <input
                  className="ls-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="ls-field">
                <label className="ls-label">Password</label>
                <input
                  className="ls-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>

              {mode === "register" && (
                <div className="ls-field">
                  <label className="ls-label">Confirm Password</label>
                  <input
                    className="ls-input"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              )}

              <button className="ls-submit" type="submit" disabled={loading}>
                {loading && <span className="ls-spinner" />}
                {loading
                  ? "Please wait…"
                  : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
              </button>
            </form>

            <p className="ls-footer-note">
              {mode === "login" ? (
                <>No account? <span style={{ color: "var(--moss)", cursor: "pointer", fontWeight: 500 }} onClick={() => { setMode("register"); clearError(); }}>Register here</span></>
              ) : (
                <>Already registered? <span style={{ color: "var(--moss)", cursor: "pointer", fontWeight: 500 }} onClick={() => { setMode("login"); clearError(); }}>Sign in</span></>
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Friendly Firebase error messages ──────────────────────────────────────────
function friendlyError(code) {
  const map = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/email-already-in-use": "This email is already registered.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return map[code] || "Something went wrong. Please try again.";
}