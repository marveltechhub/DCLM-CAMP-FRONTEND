const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export type UserRole = 'super_admin' | 'admin';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  location?: { _id: string; name: string; code?: string } | null;
};

export type Location = { _id: string; name: string; code?: string; isActive?: boolean };

export type Registration = {
  _id: string;
  registrationNumber: string;
  fullName: string;
  gender: string;
  age: number;
  phone: string;
  email?: string | null;
  address: string;
  location: Location;
  nextOfKinName: string;
  nextOfKinPhone: string;
  profilePictureUrl?: string;
  createdAt?: string;
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('dclm_token');
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers: hdr, ...rest } = options;
  const auth = token !== undefined ? token : getToken();
  const headers = new Headers(hdr);
  if (!headers.has('Content-Type') && rest.body && !(rest.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (auth) {
    headers.set('Authorization', `Bearer ${auth}`);
  }
  const res = await fetch(`${API}${path}`, { ...rest, headers });
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    let msg = res.statusText;
    try {
      if (ct.includes('application/json')) {
        const j = await res.json();
        msg = j.message || msg;
      }
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (ct.includes('application/json')) {
    return res.json() as Promise<T>;
  }
  return undefined as T;
}

export async function loginRequest(email: string, password: string) {
  return api<{ token: string; user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    token: null,
  });
}

export async function meRequest(token: string) {
  return api<{ user: AuthUser & { location?: Location | null } }>('/auth/me', { token });
}

export function exportRegistrationsUrl(query: Record<string, string>) {
  const q = new URLSearchParams(query).toString();
  return `${API}/registrations/export?${q}`;
}

export function getStoredToken() {
  return getToken();
}

export async function fetchWithAuth(path: string, init: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API}${path}`, { ...init, headers });
}

export async function downloadBlob(path: string, filename: string) {
  const res = await fetchWithAuth(path);
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = j.message || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function getLocations(activeOnly = true) {
  const q = activeOnly ? '' : '?active=false';
  return api<{ locations: Location[] }>(`/locations${q}`);
}

export async function createLocation(body: { name: string; code?: string; description?: string }) {
  return api<{ location: Location }>('/locations', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateLocation(
  id: string,
  body: Partial<{ name: string; code: string; description: string; isActive: boolean }>
) {
  return api<{ location: Location }>(`/locations/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export type AdminUser = AuthUser & { isActive?: boolean; _id?: string };

function withId<T extends { _id?: string; id?: string }>(u: T): T & { id: string } {
  const id = u.id || u._id || '';
  return { ...u, id: String(id) };
}

export async function listAdmins() {
  const res = await api<{ users: AdminUser[] }>('/users/admins');
  return { users: res.users.map((u) => withId(u)) };
}

export async function createAdmin(body: {
  name: string;
  email: string;
  password: string;
  locationId: string;
}) {
  return api<{ user: AdminUser }>('/users/admins', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateAdmin(
  id: string,
  body: Partial<{ name: string; email: string; password: string; locationId: string; isActive: boolean }>
) {
  return api<{ user: AdminUser }>(`/users/admins/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function deleteAdmin(id: string) {
  return api<{ message: string }>(`/users/admins/${id}`, { method: 'DELETE' });
}

export type StatsResponse = {
  total: number;
  byLocation: { location: { name: string; code?: string }; count: number }[];
};

export async function getStats() {
  return api<StatsResponse>('/registrations/stats');
}

export type ListRegistrationsResponse = {
  registrations: Registration[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

export async function listRegistrations(params: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') q.set(k, String(v));
  });
  return api<ListRegistrationsResponse>(`/registrations?${q.toString()}`);
}

export async function createRegistrationForm(form: FormData) {
  return fetchWithAuth('/registrations', { method: 'POST', body: form }).then(async (res) => {
    const ct = res.headers.get('content-type') || '';
    if (!res.ok) {
      let msg = res.statusText;
      if (ct.includes('application/json')) {
        try {
          const j = await res.json();
          msg = j.message || msg;
        } catch {
          /* ignore */
        }
      }
      throw new Error(msg);
    }
    return res.json() as Promise<{ registration: Registration }>;
  });
}

export async function updateRegistrationForm(id: string, form: FormData) {
  return fetchWithAuth(`/registrations/${id}`, { method: 'PATCH', body: form }).then(async (res) => {
    const ct = res.headers.get('content-type') || '';
    if (!res.ok) {
      let msg = res.statusText;
      if (ct.includes('application/json')) {
        try {
          const j = await res.json();
          msg = j.message || msg;
        } catch {
          /* ignore */
        }
      }
      throw new Error(msg);
    }
    return res.json() as Promise<{ registration: Registration }>;
  });
}

export async function deleteRegistration(id: string) {
  return api<{ message: string }>(`/registrations/${id}`, { method: 'DELETE' });
}

export { API };
