// components/OCRUpload.js

"use client";

import { useState } from "react";

const OCRUpload = ({ onUpload }) => {
  const [file, setFile] = useState(null);

  const handleUpload = () => {
    if (!file) return alert("Upload file first");
    onUpload(file);
  };

  return (
    <div style={styles.container}>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload}>Extract Text</button>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    gap: "10px",
  },
};

export default OCRUpload;