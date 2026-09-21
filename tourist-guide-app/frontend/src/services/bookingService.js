import apiClient from "./apiClient";

export const createBooking = async (bookingData) => {
  return apiClient.post("/api/bookings/create", bookingData);
};

export const getMyBookings = async () => {
  return apiClient.get("/api/bookings/my-bookings");
};

export const getGuideBookings = async () => {
  return apiClient.get("/api/bookings/guide-bookings");
};

export const getBookingDetails = async (bookingId) => {
  return apiClient.get(`/api/bookings/${bookingId}`);
};

export const cancelBooking = async (bookingId, cancellationReason) => {
  return apiClient.put(`/api/bookings/cancel/${bookingId}`, { cancellationReason });
};

export const updateBookingStatus = async (bookingId, statusData) => {
  // statusData shape: { status, otp, cancellationReason }
  return apiClient.put(`/api/bookings/status/${bookingId}`, statusData);
};

export const getGuideAvailability = async (guideId, params) => {
  return apiClient.get(`/api/bookings/availability/${guideId}`, { params });
};

export const blockGuideAvailability = async (blockData) => {
  return apiClient.post("/api/bookings/availability/block", blockData);
};

export const deleteGuideAvailability = async (availabilityId) => {
  return apiClient.delete(`/api/bookings/availability/${availabilityId}`);
};
