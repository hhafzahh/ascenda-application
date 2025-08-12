// src/components/HotelOverview/utils.js

/**
 * Splits a hotel description HTML string into:
 * - main: everything except the "Distances..." block and the first "Nearest airports..." <p> block
 * - nearby: the "Distances are displayed ... (up to before airports marker)"
 * - airports: the first "The nearest airports are: ... </p>" block
 */
export function splitDescription(text = "") {
  if (typeof text !== "string") {
    return { main: "", nearby: "", airports: "" };
  }

  const distancesMarker = "Distances are displayed";
  const airportsMarker = "The nearest airports are:";

  const distancesIdx = text.indexOf(distancesMarker);
  const airportsIdx = text.indexOf(airportsMarker);

  let mainDescription = text;
  let nearbyAmenities = "";
  let nearestAirports = "";

  if (distancesIdx !== -1 && airportsIdx !== -1) {
    mainDescription =
      text.slice(0, distancesIdx).trim() +
      "\n\n" +
      text
        .slice(airportsIdx + text.slice(airportsIdx).indexOf("</p>") + 4)
        .trim();

    nearbyAmenities = text.slice(distancesIdx, airportsIdx).trim();
    nearestAirports = text
      .slice(
        airportsIdx,
        airportsIdx + text.slice(airportsIdx).indexOf("</p>") + 4
      )
      .trim();
  }

  return { main: mainDescription, nearby: nearbyAmenities, airports: nearestAirports };
}

/**
 * Pure rating breakdown for a 0..5 rating.
 * Returns counts so UI can render icons without embedding React here.
 */
export function computeStarParts(rating = 0) {
  const n = Number.isFinite(rating) ? rating : 0;
  const clamped = Math.min(5, Math.max(0, n)); // clamp to [0,5]
  const full = Math.floor(clamped);
  const half = clamped - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return { full, half, empty };
}
