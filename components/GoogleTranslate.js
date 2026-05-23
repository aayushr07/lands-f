"use client";

import { useEffect, useState } from "react";

export default function GoogleTranslate() {
  const [isTranslateVisible, setIsTranslateVisible] = useState(false);

  useEffect(() => {
    const addGoogleTranslateScript = () => {
      if (window.googleTranslateElementInit) return;

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi,mr,ta,te,bn,gu,kn,pa,bho,ml",
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          "google_translate_element"
        );
      };

      const script = document.createElement("script");
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    };

    addGoogleTranslateScript();
  }, []);

  return (
    <div className="translate-widget">
      <button
        onClick={() => setIsTranslateVisible(!isTranslateVisible)}
        className="translate-toggle"
        aria-label="Toggle translation options"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="m5 8 6 6" />
          <path d="m4 14 6-6 2-3" />
          <path d="M2 5h12" />
          <path d="M7 2h1" />
          <path d="m22 22-5-10-5 10" />
          <path d="M14 18h6" />
        </svg>
      </button>
      
      <div 
        id="google_translate_element" 
        className={`translate-dropdown ${isTranslateVisible ? 'visible' : 'hidden'}`}
      />
      
      <style jsx>{`
        .translate-widget {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        
        .translate-toggle {
          background-color: #ffffff;
          color: #4285F4;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .translate-toggle:hover {
          background-color: #f5f5f5;
          transform: scale(1.05);
        }
        
        .translate-dropdown {
          margin-top: 8px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 8px;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .translate-dropdown.hidden {
          opacity: 0;
          transform: translateY(-10px);
          pointer-events: none;
        }
        
        .translate-dropdown.visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        /* Override Google Translate widget styles */
        :global(.goog-te-gadget) {
          font-family: inherit !important;
          font-size: 14px !important;
        }
        
        :global(.goog-te-gadget-simple) {
          border: 1px solid #e0e0e0 !important;
          border-radius: 4px !important;
          padding: 6px 8px !important;
        }
        
        :global(.goog-te-menu-value) {
          color: #333 !important;
        }
      `}</style>
    </div>
  );
}