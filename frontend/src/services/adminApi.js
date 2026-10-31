/**
 * Comprehensive System Admin API Service - Farm Management System (FMS)
 * Covers Farmers, Crop Operations, Land Parcels, Financials, Mandi Prices,
 * AI Advisory Monitor, Announcements, System Health, and Reporting.
 */

export const API_BASE = '/api/admin-api';

function getAdminHeaders() {
  const token = localStorage.getItem('fms_admin_token');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Token ${token}` } : {}),
  };
}

async function handleRes(res) {
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.error || data?.detail || `Request failed (${res.status})`);
  return data;
}

// ── Auth & Profile ─────────────────────────────────────────────────────────
export async function adminLogin(username, password) {
  const res = await fetch(`${API_BASE}/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleRes(res);
}

export async function fetchAdminProfile() {
  const res = await fetch(`${API_BASE}/profile/`, { headers: getAdminHeaders() });
  return handleRes(res);
}

// ── Dashboard & Stats ──────────────────────────────────────────────────────
export async function fetchAdminStats() {
  const res = await fetch(`${API_BASE}/stats/`, { headers: getAdminHeaders() });
  return handleRes(res);
}

export async function fetchRecentActivity() {
  const res = await fetch(`${API_BASE}/activity/`, { headers: getAdminHeaders() });
  return handleRes(res);
}

export async function fetchPlatformReport() {
  const res = await fetch(`${API_BASE}/report/`, { headers: getAdminHeaders() });
  return handleRes(res);
}

// ── Farmer Lifecycle Management ─────────────────────────────────────────────
export async function fetchFarmers() {
  const res = await fetch(`${API_BASE}/farmers/`, { headers: getAdminHeaders() });
  return handleRes(res);
}

export async function createFarmer(farmerData) {
  const res = await fetch(`${API_BASE}/farmers/create/`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify(farmerData),
  });
  return handleRes(res);
}

export async function updateFarmer(userId, farmerData) {
  const res = await fetch(`${API_BASE}/farmers/${userId}/update/`, {
    method: 'PATCH',
    headers: getAdminHeaders(),
    body: JSON.stringify(farmerData),
  });
  return handleRes(res);
}

export async function resetFarmerPassword(userId, newPassword) {
  const res = await fetch(`${API_BASE}/farmers/${userId}/reset-password/`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ new_password: newPassword }),
  });
  return handleRes(res);
}

export async function toggleFarmer(userId) {
  const res = await fetch(`${API_BASE}/farmers/${userId}/toggle/`, {
    method: 'POST',
    headers: getAdminHeaders(),
  });
  return handleRes(res);
}

export async function deleteFarmer(userId) {
  const res = await fetch(`${API_BASE}/farmers/${userId}/delete/`, {
    method: 'DELETE',
    headers: getAdminHeaders(),
  });
  return handleRes(res);
}

export async function fetchFarmerReport(userId) {
  const res = await fetch(`${API_BASE}/farmers/${userId}/report/`, { headers: getAdminHeaders() });
  return handleRes(res);
}

// ── Crop & Field Operations ─────────────────────────────────────────────────
export async function fetchCrops(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE}/crops/${query ? `?${query}` : ''}`;
  const res = await fetch(url, { headers: getAdminHeaders() });
  return handleRes(res);
}

export async function updateCropStatus(cropId, status) {
  const res = await fetch(`${API_BASE}/crops/${cropId}/status/`, {
    method: 'PATCH',
    headers: getAdminHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleRes(res);
}

export async function deleteCrop(cropId) {
  const res = await fetch(`${API_BASE}/crops/${cropId}/delete/`, {
    method: 'DELETE',
    headers: getAdminHeaders(),
  });
  return handleRes(res);
}

export async function fetchFields() {
  const res = await fetch(`${API_BASE}/fields/`, { headers: getAdminHeaders() });
  return handleRes(res);
}

// ── Financials, Expenses & Sales ────────────────────────────────────────────
export async function fetchExpenses(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE}/expenses/${query ? `?${query}` : ''}`;
  const res = await fetch(url, { headers: getAdminHeaders() });
  return handleRes(res);
}

export async function fetchSales(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE}/sales/${query ? `?${query}` : ''}`;
  const res = await fetch(url, { headers: getAdminHeaders() });
  return handleRes(res);
}

// ── Mandi APMC Prices ───────────────────────────────────────────────────────
export async function fetchMandiPrices() {
  const res = await fetch(`${API_BASE}/mandi-prices/`, { headers: getAdminHeaders() });
  return handleRes(res);
}

export async function updateMandiPrice(priceData) {
  const res = await fetch(`${API_BASE}/mandi-prices/update/`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify(priceData),
  });
  return handleRes(res);
}

export async function predictAIMandiPrice(crop_key, market_name = 'Maharashtra APMC', state = 'Maharashtra') {
  const res = await fetch(`${API_BASE}/mandi-prices/ai-predict/`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ crop_key, market_name, state }),
  });
  return handleRes(res);
}

export async function predictAllAIMandiPrices() {
  const res = await fetch(`${API_BASE}/mandi-prices/ai-predict-all/`, {
    method: 'POST',
    headers: getAdminHeaders(),
  });
  return handleRes(res);
}

// ── AI Advisory & ML Diagnostics ────────────────────────────────────────────
export async function fetchAIAdvisoryLogs() {
  const res = await fetch(`${API_BASE}/ai-advisory/`, { headers: getAdminHeaders() });
  return handleRes(res);
}

export async function fetchMLModelsStatus() {
  const res = await fetch(`${API_BASE}/ml-models-status/`, { headers: getAdminHeaders() });
  return handleRes(res);
}

export async function retrainMLModels() {
  const res = await fetch(`${API_BASE}/retrain-models/`, {
    method: 'POST',
    headers: getAdminHeaders(),
  });
  return handleRes(res);
}

// ── Broadcast Announcements ─────────────────────────────────────────────────
export async function fetchAnnouncements() {
  const res = await fetch(`${API_BASE}/announcements/`, { headers: getAdminHeaders() });
  return handleRes(res);
}

export async function createAnnouncement(annData) {
  const res = await fetch(`${API_BASE}/announcements/`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify(annData),
  });
  return handleRes(res);
}

export async function toggleAnnouncement(id, isActive) {
  const res = await fetch(`${API_BASE}/announcements/${id}/`, {
    method: 'PATCH',
    headers: getAdminHeaders(),
    body: JSON.stringify({ is_active: isActive }),
  });
  return handleRes(res);
}

export async function deleteAnnouncement(id) {
  const res = await fetch(`${API_BASE}/announcements/${id}/`, {
    method: 'DELETE',
    headers: getAdminHeaders(),
  });
  return handleRes(res);
}

// ── Public Announcements for Farmers / Visitors ─────────────────────────────
export async function fetchPublicAnnouncements() {
  const res = await fetch('/api/announcements/');
  return handleRes(res);
}

// ── System Health, Recalculate & Demo Tools ─────────────────────────────────
export async function fetchSystemHealth() {
  const res = await fetch(`${API_BASE}/system-health/`, { headers: getAdminHeaders() });
  return handleRes(res);
}

export async function recalculateAllFinancials() {
  const res = await fetch(`${API_BASE}/recalculate-all/`, {
    method: 'POST',
    headers: getAdminHeaders(),
  });
  return handleRes(res);
}

export async function seedDemoData() {
  const res = await fetch(`${API_BASE}/seed-demo-data/`, {
    method: 'POST',
    headers: getAdminHeaders(),
  });
  return handleRes(res);
}

// ── Database Backup & Archive ───────────────────────────────────────────────
export async function fetchBackups() {
  const res = await fetch(`${API_BASE}/backups/`, { headers: getAdminHeaders() });
  return handleRes(res);
}

export async function createDatabaseBackup() {
  const res = await fetch(`${API_BASE}/backups/create/`, {
    method: 'POST',
    headers: getAdminHeaders(),
  });
  return handleRes(res);
}

