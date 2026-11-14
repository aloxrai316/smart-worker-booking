export const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const img = (p) => (p ? `${API}${p}` : null);

// Fetch wrapper: adds JWT, handles JSON or FormData, throws readable errors
export async function api(path, { method = 'GET', body, form } = {}) {
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  let payload;
  if (form) payload = form;
  else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  let res;
  try {
    res = await fetch(`${API}/api${path}`, { method, headers, body: payload });
  } catch {
    throw new Error(`Cannot reach the server at ${API}. Start the backend (cd backend → npm run dev) and check its terminal for errors.`);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}
