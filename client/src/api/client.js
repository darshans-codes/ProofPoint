import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 30000,
  withCredentials: true,
});

export const loginWithGoogle = async (credential) => {
  const { data } = await api.post('/auth/google', { credential });
  return data.user;
};

export const loginAsGuest = async () => {
  const { data } = await api.post('/auth/guest');
  return data.user;
};

export const getCurrentUser = async () => {
  const { data } = await api.get('/auth/me');
  return data.user;
};

export const logout = async () => {
  await api.post('/auth/logout');
};

// Health check
export const getHealth = async () => {
  const { data } = await api.get('/health');
  return data;
};

// Projects
export const getProjects = async () => {
  const { data } = await api.get('/projects');
  return data.projects || [];
};

export const createProject = async (projectData) => {
  const { data } = await api.post('/projects', projectData);
  return data.project;
};

// Assets
export const getAssets = async (params = {}) => {
  const { data } = await api.get('/assets', { params });
  return data;
};

export const getAllAssets = async (params = {}) => {
  const firstPage = await getAssets({ ...params, page: 1, limit: 100 });
  const total = firstPage.pagination?.total || firstPage.assets?.length || 0;
  const pages = Math.ceil(total / 100);

  if (pages <= 1) return firstPage.assets || [];

  const remaining = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      getAssets({ ...params, page: index + 2, limit: 100 })
    )
  );

  return [
    ...(firstPage.assets || []),
    ...remaining.flatMap((page) => page.assets || []),
  ];
};

export const getAssetById = async (id) => {
  const { data } = await api.get(`/assets/${id}`);
  return data.asset;
};

export const uploadAssets = async (formData, onProgress) => {
  const { data } = await api.post('/assets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
  return data.assets || [];
};

export const deleteAsset = async (id) => {
  const { data } = await api.delete(`/assets/${id}`);
  return data;
};

export const reanalyzeAsset = async (id) => {
  const { data } = await api.post(`/assets/${id}/reanalyze`);
  return data.asset;
};

// Semantic Natural-Language Search
export const searchAssets = async (query, limit = 12) => {
  const { data } = await api.post('/search', { query, limit });
  return data;
};

// Suggested Before/After Pairs
export const getSuggestedPairs = async (projectId) => {
  const { data } = await api.get('/pairs', { params: { projectId } });
  return data.pairs || [];
};

// Compare
const comparisonRequests = new Map();

export const compareAssets = async (beforeId, afterId) => {
  const key = `${beforeId}:${afterId}`;
  const existing = comparisonRequests.get(key);
  if (existing) return existing;

  const request = api
    .post('/compare', { beforeId, afterId })
    .then(({ data }) => data)
    .finally(() => comparisonRequests.delete(key));

  comparisonRequests.set(key, request);
  return request;
};

// Reports
export const createReport = async (reportData) => {
  const { data } = await api.post('/reports', reportData);
  return data.report;
};

export const getReports = async (projectId) => {
  const { data } = await api.get('/reports', { params: { projectId } });
  return data.reports || [];
};

export const getReportBySlug = async (slug) => {
  const { data } = await api.get(`/reports/${slug}`);
  return data.report;
};

export default api;
