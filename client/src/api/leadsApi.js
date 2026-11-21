const BASE_URL = '/api/leads';

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

export const leadsApi = {
  /**
   * Fetch leads with optional filters and pagination
   */
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.set(key, String(val));
      }
    });
    const qs = query.toString();
    return fetch(`${BASE_URL}${qs ? '?' + qs : ''}`, {
      credentials: 'include',
    }).then(handleResponse);
  },

  /**
   * Fetch statistics
   */
  getStats: () =>
    fetch(`${BASE_URL}/stats`, {
      credentials: 'include',
    }).then(handleResponse),

  /**
   * Fetch single lead
   */
  getById: (id) =>
    fetch(`${BASE_URL}/${id}`, {
      credentials: 'include',
    }).then(handleResponse),

  /**
   * Create a new lead
   */
  create: (data) =>
    fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    }).then(handleResponse),

  /**
   * Update an existing lead
   */
  update: (id, data) =>
    fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    }).then(handleResponse),

  /**
   * Delete a lead
   */
  delete: (id) =>
    fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    }).then(handleResponse),
};
