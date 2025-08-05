export function storeRecentlyViewed(hotel, searchParams) {
  console.log("storeRecentlyViewed() called with:", hotel);
  console.log("storeRecentlyViewed() searchParams called with:", searchParams);

  if (!hotel?.id) {
    console.warn("No hotel.id");
    return;
  }

  //hotel + searchparams
  const hotelEntry = { ...hotel, searchParams };

  const viewed = JSON.parse(localStorage.getItem("viewedHotels") || "[]");
  console.log("Existing viewed:", viewed);

  const exists = viewed.some((h) => h.id === hotel.id);
  const updated = exists ? viewed : [hotelEntry, ...viewed].slice(0, 4);

  console.log("Saving updated list:", updated);
  localStorage.setItem("viewedHotels", JSON.stringify(updated));
}
