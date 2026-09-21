import apiClient from "./apiClient";

export const estimatePackage = async (packageData) => {
  return apiClient.post("/api/custom-package/estimate", packageData);
};

export const savePackage = async (packageData) => {
  return apiClient.post("/api/custom-package/save", packageData);
};

export const getMyPackages = async () => {
  return apiClient.get("/api/custom-package/my");
};

export const getPackageDetails = async (packageId) => {
  return apiClient.get(`/api/custom-package/${packageId}`);
};

export const deletePackage = async (packageId) => {
  return apiClient.delete(`/api/custom-package/${packageId}`);
};
