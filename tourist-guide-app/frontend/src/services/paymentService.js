import apiClient from "./apiClient";

export const createPaymentOrder = async (orderData) => {
  return apiClient.post("/api/payments/create-order", orderData);
};

export const verifyPayment = async (paymentData) => {
  return apiClient.post("/api/payments/verify", paymentData);
};

export const getPaymentHistory = async () => {
  return apiClient.get("/api/payments/history");
};

export const refundPayment = async (bookingId, refundData) => {
  return apiClient.post(`/api/payments/refund/${bookingId}`, refundData);
};

export const getUserPayments = async () => {
  return apiClient.get("/api/payments/user");
};

export const getGuideEarningsAnalytics = async () => {
  return apiClient.get("/api/payments/guide/analytics");
};

export const getAdminPaymentAnalytics = async (filters) => {
  return apiClient.get("/api/payments/admin/analytics", { params: filters });
};

export const updatePaymentStatus = async (paymentId, status) => {
  return apiClient.put(`/api/payments/${paymentId}/status`, { status });
};
