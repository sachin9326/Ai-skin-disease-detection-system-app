/**
 * Auth Utility for SkinScan AI
 * Manages user accounts, authentication tokens, and server persistence.
 */

const TOKEN_KEY = 'skinscan_auth_token';
const USER_KEY = 'skinscan_user_info';

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (!raw || !token) return null;
    return { ...JSON.parse(raw), token };
  } catch (err) {
    return null;
  }
}

export async function login({ email, password }) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Login failed.');
  }

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function register({ name, email, password }) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Registration failed.');
  }

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Fetch authenticated user scans from backend
 */
export async function fetchUserScansRemote() {
  const user = getCurrentUser();
  if (!user || !user.token) return [];

  try {
    const res = await fetch('/api/user/scans', {
      headers: { 'Authorization': `Bearer ${user.token}` }
    });
    const data = await res.json();
    return data.success ? data.scans : [];
  } catch (err) {
    return [];
  }
}

/**
 * Save user scan to backend
 */
export async function saveUserScanRemote(scanData) {
  const user = getCurrentUser();
  if (!user || !user.token) return null;

  try {
    const res = await fetch('/api/user/scans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({ scanData })
    });
    const data = await res.json();
    return data.success ? data.record : null;
  } catch (err) {
    return null;
  }
}
