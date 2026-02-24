// src/lib/apiClient.js
// Fetch-Wrapper: Fügt automatisch Bearer Token hinzu, loggt bei 401 aus

export async function adminFetch(url, options = {}) {
  const token = localStorage.getItem('si_admin_token');

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  // Bei 401: Token abgelaufen oder ungültig → ausloggen
  if (response.status === 401) {
    localStorage.removeItem('si_admin_token');
    localStorage.removeItem('si_admin_user');
    window.location.href = '/login';
    throw new Error('Session abgelaufen');
  }

  return response;
}
