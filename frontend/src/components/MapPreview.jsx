import React from "react";
import { FiMaximize2 } from "react-icons/fi";
import MapView from "./MapView";

export default function MapPreview({ hotels, onClickExpand }) {
  return (
    <div
      style={{
        position: "relative",
        height: 220,
        borderRadius: 8,
        overflow: "hidden",
        marginTop: 16,
        boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
        width: "260px",
      }}
    >
      <MapView hotels={hotels} height={220} />

      {/* Expand icon in corner */}
      <div
        onClick={onClickExpand}
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          background: "rgba(255,255,255,0.85)",
          padding: 6,
          borderRadius: 6,
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
          zIndex: 1000,
        }}
        aria-label="Expand Map"
        title="Expand Map"
      >
        <FiMaximize2 size={20} />
      </div>
    </div>
  );
}
