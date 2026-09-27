const API_BASE = "";

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: FetchOptions & { base?: string } = {}): Promise<T> {
  const { params, base, ...fetchOptions } = options;

  // Build URL with query params
  let url = `${base || API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    ...fetchOptions,
    credentials: base ? "omit" : "include",
    headers: {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
  });

  if (!res.ok) {
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    throw new ApiError(
      `API error: ${res.status} ${res.statusText}`,
      res.status,
      data
    );
  }

  // Handle 204 No Content
  if (res.status === 204) return null as T;

  return res.json();
}

export const api = {
  get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) {
    return request<T>(endpoint, { method: "GET", params });
  },

  post<T>(endpoint: string, body?: unknown) {
    return request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: unknown) {
    return request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: unknown) {
    return request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) {
    return request<T>(endpoint, { method: "DELETE", params });
  },
};

// SweetLease admin calls go through Hive's own /api/admin proxy (same origin,
// session-checked, key added server-side). Nothing secret reaches the browser.
export const sweetleaseApi = {
  get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) { return api.get<T>(endpoint, params); },
  post<T>(endpoint: string, body?: unknown) { return api.post<T>(endpoint, body); },
  patch<T>(endpoint: string, body?: unknown) { return api.patch<T>(endpoint, body); },
};

export { ApiError };
