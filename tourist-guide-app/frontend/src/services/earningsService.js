import apiClient from "./apiClient";

export const getGuideEarnings = async () => {
  return apiClient.get("/api/guide/earnings");
};

export const getGuideBookingEarnings = async (page = 1, limit = 20) => {
  return apiClient.get("/api/guide/earnings/bookings", {
    params: { page, limit },
  });
};
