export function storeRecentlyViewed(hotel) {
  console.log("storeRecentlyViewed() called with:", hotel);

  if (!hotel?.id) {
    console.warn("No hotel.id");
    return;
  }

  const viewed = JSON.parse(localStorage.getItem("viewedHotels") || "[]");
  console.log("Existing viewed:", viewed);

  const exists = viewed.some((h) => h.id === hotel.id);
  const updated = exists ? viewed : [hotel, ...viewed].slice(0, 4);

  console.log("Saving updated list:", updated);
  localStorage.setItem("viewedHotels", JSON.stringify(updated));
}
