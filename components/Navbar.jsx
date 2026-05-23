"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/search", label: "Search" },
  { href: "/verify", label: "Verify" },
  { href: "/docu", label: "Doc Service" },
  { href: "/clauseai", label: "Clause AI" },
  { href: "/mylands", label: "My Lands" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');

        .nav-root {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          transition: all 0.3s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .nav-root.scrolled {
          background: rgba(8, 12, 18, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 4px 30px rgba(0,0,0,0.3);
        }
        .nav-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 0 24px;
          height: 68px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 32px;
        }

        /* LOGO */
        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; flex-shrink: 0;
        }
        .nav-logo-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: linear-gradient(135deg, #4ade80, #22c55e);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 16px rgba(74,222,128,0.35);
        }
        .nav-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 19px; font-weight: 800;
          color: #fff; letter-spacing: -0.02em;
        }
        .nav-logo-text span { color: #4ade80; }

        /* LINKS */
        .nav-links {
          display: flex; align-items: center; gap: 4px;
          list-style: none; margin: 0; padding: 0; flex: 1; justify-content: center;
        }
        .nav-links a {
          display: block; padding: 8px 14px;
          border-radius: 8px;
          font-size: 14px; font-weight: 500;
          color: rgba(232,237,245,0.65);
          text-decoration: none;
          transition: all 0.2s;
          position: relative;
        }
        .nav-links a:hover { color: #e8edf5; background: rgba(255,255,255,0.06); }
        .nav-links a.active {
          color: #4ade80;
          background: rgba(74,222,128,0.08);
        }
        .nav-links a.active::after {
          content: ''; position: absolute; bottom: -1px; left: 50%; transform: translateX(-50%);
          width: 16px; height: 2px; border-radius: 2px;
          background: #4ade80;
        }

        /* ACTIONS */
        .nav-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .nav-btn-ghost {
          padding: 8px 18px; border-radius: 8px;
          background: transparent; color: rgba(232,237,245,0.7);
          border: 1px solid rgba(255,255,255,0.1);
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
          text-decoration: none; transition: all 0.2s;
        }
        .nav-btn-ghost:hover { color: #e8edf5; border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04); }
        .nav-btn-main {
          padding: 8px 20px; border-radius: 8px;
          background: #4ade80; color: #041a0a;
          font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
          text-decoration: none; transition: all 0.2s;
          box-shadow: 0 0 20px rgba(74,222,128,0.25);
          display: flex; align-items: center; gap: 6px;
        }
        .nav-btn-main:hover { background: #22c55e; box-shadow: 0 0 28px rgba(74,222,128,0.35); transform: translateY(-1px); }

        /* HAMBURGER */
        .nav-hamburger {
          display: none; flex-direction: column; gap: 5px;
          cursor: pointer; padding: 6px; background: none; border: none;
        }
        .ham-line {
          width: 22px; height: 2px; border-radius: 2px;
          background: #e8edf5; transition: all 0.25s;
          transform-origin: center;
        }
        .nav-hamburger.open .ham-line:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
        .nav-hamburger.open .ham-line:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .nav-hamburger.open .ham-line:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

        /* MOBILE MENU */
        .nav-mobile {
          display: none;
          position: fixed; top: 68px; left: 0; right: 0; bottom: 0;
          background: rgba(8, 12, 18, 0.97);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          padding: 24px;
          flex-direction: column; gap: 8px;
          border-top: 1px solid rgba(255,255,255,0.07);
          overflow-y: auto;
          animation: slideDown 0.25s ease;
        }
        .nav-mobile.open { display: flex; }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .nav-mobile a {
          display: block; padding: 14px 18px; border-radius: 12px;
          font-size: 16px; font-weight: 500; color: rgba(232,237,245,0.75);
          text-decoration: none; transition: all 0.2s;
          border: 1px solid transparent;
        }
        .nav-mobile a:hover { color: #e8edf5; background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.07); }
        .nav-mobile a.active { color: #4ade80; background: rgba(74,222,128,0.08); border-color: rgba(74,222,128,0.2); }
        .mobile-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 8px 0; }
        .mobile-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
        .nav-mobile .nav-btn-main, .nav-mobile .nav-btn-ghost {
          text-align: center; justify-content: center; padding: 14px; border-radius: 12px; font-size: 15px;
        }

        @media (max-width: 900px) {
          .nav-links { display: none; }
          .nav-actions { display: none; }
          .nav-hamburger { display: flex; }
        }
      `}</style>

      <nav className={`nav-root${scrolled ? " scrolled" : ""}`}>
        <div className="nav-inner">
          {/* Logo */}
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon">
              <svg viewBox="0 0 24 24" fill="white" style={{ width: 18, height: 18 }}>
                <path d="M11.644 1.59a.75.75 0 0 1 .712 0l9.75 5.25a.75.75 0 0 1 0 1.32l-9.75 5.25a.75.75 0 0 1-.712 0l-9.75-5.25a.75.75 0 0 1 0-1.32l9.75-5.25Z" />
                <path d="m3.265 10.602 7.668 4.129a2.25 2.25 0 0 0 2.134 0l7.668-4.13 1.37.739a.75.75 0 0 1 0 1.32l-9.75 5.25a.75.75 0 0 1-.71 0l-9.75-5.25a.75.75 0 0 1 0-1.32l1.37-.738Z" />
                <path d="m10.933 19.231-7.668-4.13-1.37.739a.75.75 0 0 0 0 1.32l9.75 5.25c.221.12.489.12.71 0l9.75-5.25a.75.75 0 0 0 0-1.32l-1.37-.738-7.668 4.13a2.25 2.25 0 0 1-2.134-.001Z" />
              </svg>
            </div>
            <span className="nav-logo-text">Land<span>Sure</span></span>
          </Link>

          {/* Desktop Links */}
          <ul className="nav-links">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={pathname === l.href ? "active" : ""}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop Actions */}
          <div className="nav-actions">
            <Link href="/login" className="nav-btn-ghost">Log in</Link>
            <Link href="/mylands" className="nav-btn-main">
              <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
                <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
              </svg>
              Add Land
            </Link>
          </div>

          {/* Hamburger */}
          <button
            className={`nav-hamburger${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span className="ham-line" />
            <span className="ham-line" />
            <span className="ham-line" />
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`nav-mobile${menuOpen ? " open" : ""}`}>
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className={pathname === l.href ? "active" : ""}>
              {l.label}
            </Link>
          ))}
          <div className="mobile-divider" />
          <div className="mobile-actions">
            <Link href="/login" className="nav-btn-ghost">Log in</Link>
            <Link href="/add-land" className="nav-btn-main">+ Add Land</Link>
          </div>
        </div>
      </nav>
    </>
  );
}