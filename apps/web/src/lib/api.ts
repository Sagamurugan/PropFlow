// ==============================================================================
// PropFlow AI - Client-Side API Helper & Session persistence
// Handles token storage, automatic authorization header injection, and session refreshes
// ==============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function setTokens(accessToken: string, refreshToken: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pf_access_token', accessToken);
    localStorage.setItem('pf_refresh_token', refreshToken);
  }
}

export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('pf_access_token');
  }
  return null;
}

export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('pf_refresh_token');
  }
  return null;
}

export function clearTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pf_access_token');
    localStorage.removeItem('pf_refresh_token');
    localStorage.removeItem('pf_user_session');
  }
}

export function saveUserSession(user: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pf_user_session', JSON.stringify(user));
  }
}

export function getUserSession(): any | null {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('pf_user_session');
    return data ? JSON.parse(data) : null;
  }
  return null;
}

/**
 * Standard fetch wrapper that attaches Bearer tokens and handles token refresh on 401.
 */
export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);

  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Inject optional AI provider key override from localStorage if set
  if (typeof window !== 'undefined') {
    const userApiKey =
      localStorage.getItem('pf_ai_api_key') ||
      localStorage.getItem('pf_gemini_api_key');
    if (userApiKey) {
      headers.set('x-ai-api-key', userApiKey);
    }
  }

  const response = await fetch(`${API_URL}/${endpoint.replace(/^\//, '')}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && endpoint !== 'auth/login' && endpoint !== 'auth/register') {
    // Attempt Token Refresh
    const success = await attemptSessionRefresh();
    if (success) {
      // Retry original request once
      const newToken = getAccessToken();
      headers.set('Authorization', `Bearer ${newToken}`);
      const retryResponse = await fetch(`${API_URL}/${endpoint.replace(/^\//, '')}`, {
        ...options,
        headers,
      });
      return handleResponse(retryResponse);
    } else {
      clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }
  }

  return handleResponse(response);
}

async function handleResponse(response: Response): Promise<any> {
  const text = await response.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || 'Network response error');
  }

  if (!response.ok) {
    throw new Error(json.message || 'Something went wrong');
  }

  return json;
}

async function attemptSessionRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    saveUserSession(data.user);
    return true;
  } catch {
    return false;
  }
}
