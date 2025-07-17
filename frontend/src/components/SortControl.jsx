import React from "react";

export default function SortControl({ selected, onSelect }) {
  const options = [
    { label: "Top Rating", value: "rating" },
    { label: "Lowest price first", value: "price" },
    { label: "Alphabetical", value: "alpha" },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "1rem",
        marginTop: "1rem",
      }}
    >
      <span style={{ fontWeight: 600, marginRight: "1rem" }}>Sort by</span>
      <div
        style={{
          display: "flex",
          border: "1px solid #ddd",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        {options.map((opt, index) => (
          <button
            key={opt.value}
            style={{
              backgroundColor: selected === opt.value ? "#2563eb" : "#fff",
              color: selected === opt.value ? "#fff" : "#2563eb",
              border: "none",
              borderLeft: index === 0 ? "none" : "1px solid #ddd",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
            onClick={() => onSelect(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
