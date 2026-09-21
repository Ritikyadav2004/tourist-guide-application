/**
 * Guide Profile Integrity Validator
 * Requirement:
 * "Only show complete profiles. If a guide has 0.0 rating, ₹0/day, or 'Location not shared', hide them."
 */
export const isCompleteProfile = (guide) => {
  if (!guide) return false;

  // 1. Rating must be strictly greater than 0
  const rating = Number(guide.rating ?? guide.averageRating ?? 4.8);
  const validRating = rating > 0;

  // 2. Price per day must be strictly greater than 0
  const price = Number(guide.price ?? guide.pricePerDay ?? 0);
  const validPrice = price > 0;

  // 3. Location must be present and not "Location not shared"
  let locationStr = "";
  if (typeof guide.location === "string") {
    locationStr = guide.location.trim().toLowerCase();
  } else if (typeof guide.location === "object" && guide.location !== null) {
    locationStr = (guide.location.city || guide.location.state || guide.location.country || "")
      .trim()
      .toLowerCase();
  }

  const validLocation =
    locationStr !== "" &&
    locationStr !== "location not shared" &&
    locationStr !== "location not provided" &&
    locationStr !== "undefined";

  return Boolean(validRating && validPrice && validLocation);
};
