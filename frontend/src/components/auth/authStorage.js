const TOKEN_KEY = 'asset_management_auth_token';
const USER_KEY = 'asset_management_auth_user';
const LOGIN_TIME_KEY = 'asset_management_login_time';
const TOKEN_EXPIRES_AT_KEY = 'asset_management_token_expires_at';
const SESSION_MESSAGE_KEY = 'asset_management_session_message';
const SESSION_DURATION_MS = 30 * 60 * 1000;

const readJson = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = window.atob(normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '='));
    return JSON.parse(decodedPayload);
  } catch {
    return null;
  }
};

const getStoredExpiry = () => {
  const storedExpiry = Number(localStorage.getItem(TOKEN_EXPIRES_AT_KEY));
  if (Number.isFinite(storedExpiry) && storedExpiry > 0) {
    return storedExpiry;
  }

  const loginTime = Number(localStorage.getItem(LOGIN_TIME_KEY));
  if (Number.isFinite(loginTime) && loginTime > 0) {
    return loginTime + SESSION_DURATION_MS;
  }

  return null;
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredToken = getToken;

export const getStoredUser = () => {
  return readJson(USER_KEY);
};

export const getSessionMessage = () => {
  const message = sessionStorage.getItem(SESSION_MESSAGE_KEY);
  if (message) {
    sessionStorage.removeItem(SESSION_MESSAGE_KEY);
  }
  return message;
};

export const getTokenExpiresAt = () => getStoredExpiry();

export const isTokenExpired = () => {
  const token = getToken();
  if (!token) return true;

  const expiresAt = getStoredExpiry();
  if (!expiresAt) return true;

  return Date.now() >= expiresAt;
};

export const isAuthenticated = () => Boolean(getToken()) && !isTokenExpired();

export const setStoredAuth = ({ token, user, expiresAt, expiresIn, expires_in: expiresInSnake }) => {
  const loginTime = Date.now();
  const tokenPayload = token ? decodeJwtPayload(token) : null;
  const tokenExpiry = tokenPayload?.exp ? tokenPayload.exp * 1000 : null;
  const explicitExpiry = expiresAt ? Number(expiresAt) : null;
  const durationSeconds = Number(expiresIn || expiresInSnake);
  const durationExpiry = Number.isFinite(durationSeconds) && durationSeconds > 0
    ? loginTime + durationSeconds * 1000
    : null;
  const resolvedExpiry = explicitExpiry || tokenExpiry || durationExpiry || loginTime + SESSION_DURATION_MS;

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(LOGIN_TIME_KEY, String(loginTime));
  localStorage.setItem(TOKEN_EXPIRES_AT_KEY, String(resolvedExpiry));
};

export const setStoredUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredAuth = ({ sessionExpired = false } = {}) => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LOGIN_TIME_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
  if (sessionExpired) {
    sessionStorage.setItem(SESSION_MESSAGE_KEY, 'Session expired. Please login again.');
  }
};

export const logout = (options) => clearStoredAuth(options);

export const getMillisecondsUntilExpiry = () => {
  const expiresAt = getStoredExpiry();
  return expiresAt ? Math.max(expiresAt - Date.now(), 0) : 0;
};
