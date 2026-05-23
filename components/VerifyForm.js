// components/VerifyForm.js

"use client";

import { useState } from "react";

const VerifyForm = ({ onVerify }) => {
  const [document, setDocument] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!document) return alert("Upload document");
    onVerify(document);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <input
        type="file"
        onChange={(e) => setDocument(e.target.files[0])}
      />
      <button type="submit">Verify Land</button>
    </form>
  );
};

const styles = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
};

export default VerifyForm;