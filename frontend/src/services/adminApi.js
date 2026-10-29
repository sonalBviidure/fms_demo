/**
 * Admin API Service - Farm Management System
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

export async function adminLogin(username, password) {
  const res = await fetch(`${API_BASE}/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleRes(res);
}

export async function fetchAdminStats() {
  const res = await fetch(`${API_BASE}/stats/`, { headers: getAdminHeaders() });
  return handleRes(res);
}

export async function fetchFarmers() {
  const res = await fetch(`${API_BASE}/farmers/`, { headers: getAdminHeaders() });
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

export async function fetchRecentActivity() {
  const res = await fetch(`${API_BASE}/activity/`, { headers: getAdminHeaders() });
  return handleRes(res);
}

export async function fetchFarmerReport(userId) {
  const res = await fetch(`${API_BASE}/farmers/${userId}/report/`, { headers: getAdminHeaders() });
  return handleRes(res);
}

export async function fetchPlatformReport() {
  const res = await fetch(`${API_BASE}/report/`, { headers: getAdminHeaders() });
  return handleRes(res);
}
