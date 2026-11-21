const BASE_URL = '/api/auth';

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    const message = data.error || `HTTP error ${res.status}`;
    const err = new Error(message);
    err.details = data.details || [];
    err.status = res.status;
    throw err;
  }
  return data;
}

export const authApi = {
  signup: (data) =>
    fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    }).then(handleResponse),

  login: (data) =>
    fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    }).then(handleResponse),

  logout: () =>
    fetch(`${BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
    }).then(handleResponse),

  getMe: () =>
    fetch(`${BASE_URL}/me`, {
      credentials: 'include',
    }).then(handleResponse),
};
