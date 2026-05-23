// components/SearchBar.js

"use client";

import { useState } from "react";

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    onSearch(query);
  };

  return (
    <div style={styles.container}>
      <input
        type="text"
        placeholder="Search land..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={styles.input}
      />
      <button onClick={handleSearch} style={styles.button}>
        Search
      </button>
    </div>
  );
};

const styles = {
  container: { display: "flex", gap: "10px" },
  input: { padding: "8px", flex: 1 },
  button: { padding: "8px", cursor: "pointer" },
};

export default SearchBar;