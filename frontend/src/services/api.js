/**
 * SecureGRC Centralized API Service Layer
 * Communicates exclusively with FastAPI backend at /api/v1 (http://localhost:8000/api/v1)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Simple in‑memory cache for GET requests (TTL 60s)
const _apiCache = new Map();

function _getCacheKey(endpoint) {
  return endpoint;
}

function _setCache(endpoint, data) {
  const expiry = Date.now() + 60_000; // 1 minute
  _apiCache.set(_getCacheKey(endpoint), { data, expiry });
}

function _getCache(endpoint) {
  const entry = _apiCache.get(_getCacheKey(endpoint));
  if (entry && entry.expiry > Date.now()) {
    return entry.data;
  }
  _apiCache.delete(_getCacheKey(endpoint));
  return null;
}

function _clearDashboardCache() {
  // Invalidate any cached dashboard endpoints
  for (const key of _apiCache.keys()) {
    if (key.startsWith('/dashboard')) {
      _apiCache.delete(key);
    }
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = `${API_BASE_URL}${endpoint}`;

  // For GET requests we attempt to serve from cache first
  if (!options.method || options.method.toUpperCase() === 'GET') {
    const cached = _getCache(endpoint);
    if (cached !== null) {
      return cached;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      // Invalidate dashboard cache on successful mutating requests (POST/PATCH/DELETE)
      if (options.method && options.method.toUpperCase() !== 'GET') {
        _clearDashboardCache();
      }
      return null;
    }

    const data = await response.json().catch(() => null);

    // Handle 401 Unauthorized globally — skip login itself so invalid credentials surface correctly
    if (response.status === 401 && endpoint !== '/auth/login') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authUser');
      const message = data?.detail || 'Session expired. Please log in again.';
      const err = new Error(typeof message === 'string' ? message : 'Unauthorized');
      err.status = 401;
      throw err;
    }

    if (!response.ok) {
      const errorMsg = data?.detail || data?.message || `HTTP Error ${response.status}: ${response.statusText}`;
      const err = new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      err.status = response.status;
      err.data = data;
      throw err;
    }

    // Cache successful GET responses for dashboard endpoints
    if (!options.method || options.method.toUpperCase() === 'GET') {
      if (endpoint.startsWith('/dashboard')) {
        _setCache(endpoint, data);
      }
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to SecureGRC API server. Ensure the backend is running at http://localhost:8000.');
    }
    throw error;
  }
}

// ---------------- AUTH ----------------
export async function loginApi(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe() {
  return request('/auth/me');
}

// ---------------- ORGANIZATIONS ----------------
export async function getMyOrganization() {
  return request('/organizations/me');
}

export async function getOrganizations() {
  return request('/organizations');
}

export async function createOrganization(data) {
  return request('/organizations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function switchOrganization(orgId) {
  return request(`/organizations/switch/${orgId}`, {
    method: 'POST',
  });
}

export async function updateMyOrganization(data) {
  return request('/organizations/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ---------------- DASHBOARD ----------------
export async function getKpis(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/dashboard/kpis${query ? `?${query}` : ''}`);
}

export async function getNistCoverage(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/dashboard/nist-coverage${query ? `?${query}` : ''}`);
}

export async function getRiskDistribution(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/dashboard/risk-distribution${query ? `?${query}` : ''}`);
}

export async function getControlImplementation(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/dashboard/control-implementation${query ? `?${query}` : ''}`);
}

// Helper to clear dashboard cache after data‑mutating actions
export function clearDashboardCache() {
  // Expose internal cache clear for external modules if needed
  // This simply calls the private _clearDashboardCache defined above
  _clearDashboardCache();
}

// ---------------- ACTIVITIES & NOTIFICATIONS ----------------
export async function getActivities(limit = 20) {
  return request(`/activities?limit=${limit}`);
}

export async function getNotifications() {
  return request('/notifications');
}

export async function markNotificationRead(id) {
  return request(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsRead() {
  return request('/notifications/read-all', {
    method: 'POST',
  });
}

// ---------------- ASSETS ----------------
export async function getAssets(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/assets${query ? `?${query}` : ''}`);
}

export async function getAssetById(id) {
  return request(`/assets/${id}`);
}

export async function createAsset(data) {
  return request('/assets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAsset(id, data) {
  return request(`/assets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAsset(id) {
  return request(`/assets/${id}`, {
    method: 'DELETE',
  });
}

// ---------------- RISKS ----------------
export async function getRisks(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/risks${query ? `?${query}` : ''}`);
}

export async function getRiskById(id) {
  return request(`/risks/${id}`);
}

export async function createRisk(data) {
  const result = await request('/risks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  // Invalidate cached dashboard metrics that depend on risks
  _clearDashboardCache();
  return result;
}

export async function updateRisk(id, data) {
  const result = await request(`/risks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  _clearDashboardCache();
  return result;
}

export async function deleteRisk(id) {
  const result = await request(`/risks/${id}`, {
    method: 'DELETE',
  });
  _clearDashboardCache();
  return result;
}

// ---------------- CONTROLS ----------------
export async function getControls(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/controls${query ? `?${query}` : ''}`);
}

export async function createControl(data) {
  const result = await request('/controls', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  _clearDashboardCache();
  return result;
}

export async function getControlById(id) {
  return request(`/controls/${id}`);
}

export async function getControlEvidence(id) {
  return request(`/controls/${id}/evidence`);
}

export async function updateControlAssessment(id, data) {
  const result = await request(`/controls/${id}/assessment`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  _clearDashboardCache();
  return result;
}

export async function addControlEvidence(id, data) {
  const result = await request(`/controls/${id}/evidence`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  _clearDashboardCache();
  return result;
}

// Upload evidence with file using multipart/form-data
export async function uploadControlEvidence(id, formData) {
  const token = localStorage.getItem('accessToken');
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // Let the browser set Content-Type with boundary for FormData
  };
  const url = `${API_BASE_URL}/controls/${id}/evidence/upload`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    const message = errData?.detail || errData?.message || `HTTP Error ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }
  const result = await response.json();
  // Invalidate dashboard cache
  _clearDashboardCache();
  return result;
}

// ---------------- GAPS ----------------
export async function getGaps(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/gaps${query ? `?${query}` : ''}`);
}

export async function getGapById(id) {
  return request(`/gaps/${id}`);
}

export async function createGap(data) {
  const result = await request('/gaps', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  _clearDashboardCache();
  return result;
}

export async function resolveGap(id) {
  const result = await request(`/gaps/${id}/resolve`, {
    method: 'POST',
  });
  _clearDashboardCache();
  return result;
}

export async function createRemediationForGap(id) {
  const result = await request(`/gaps/${id}/create-remediation`, {
    method: 'POST',
  });
  _clearDashboardCache();
  return result;
}

// ---------------- REMEDIATION ----------------
export async function getRemediations(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/remediation${query ? `?${query}` : ''}`);
}

export async function createRemediation(data) {
  const result = await request('/remediation', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  _clearDashboardCache();
  return result;
}

export async function updateRemediation(id, data) {
  const result = await request(`/remediation/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  _clearDashboardCache();
  return result;
}

export async function deleteRemediation(id) {
  const result = await request(`/remediation/${id}`, {
    method: 'DELETE',
  });
  _clearDashboardCache();
  return result;
}

// ---------------- FRAMEWORKS & MAPPINGS ----------------
export async function getFrameworks() {
  return request('/frameworks');
}

export async function getFrameworkMappings(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/frameworks/mappings${query ? `?${query}` : ''}`);
}

// ---------------- REPORTS ----------------
export async function getReports() {
  return request('/reports');
}

export async function createReport(data) {
  return request('/reports', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function downloadReport(reportId, reportName = 'audit_report') {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}/download`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${reportName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.html`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
  return true;
}

// ---------------- USERS & SETTINGS ----------------
export async function getUsers() {
  return request('/users');
}

export async function getSettings() {
  return request('/settings');
}

export async function updateSettings(data) {
  return request('/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
