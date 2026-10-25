import { toast } from 'sonner';

export const LIVE_BACKEND_URL = 'https://extracurricular-sc5rlfdq.b4a.run/api';

const LOCAL_DEV_HOSTS = ['localhost', '127.0.0.1'];

function isLocalDev(): boolean {
  return typeof window !== 'undefined' && LOCAL_DEV_HOSTS.includes(window.location.hostname);
}

export function getBaseApiUrl(): string {
  const override = process.env.NEXT_PUBLIC_API_URL;

  if (typeof window !== 'undefined') {
    // Hosted builds always use the same-origin serverless route: no CORS, and a stale
    // NEXT_PUBLIC_API_URL baked into the bundle can never point the live site at a laptop.
    if (!isLocalDev()) return '/api';
    return override ? override.replace(/\/$/, '') : '/api';
  }

  if (override) return override.replace(/\/$/, '');
  return 'http://localhost:5000/api';
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('cnhs_access_token');
  }

  public static async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...rest } = options;
    const baseUrl = getBaseApiUrl();

    let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${cleanEndpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const token = this.getToken();
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string>),
    };

    let response: Response;

    try {
      response = await fetch(url, {
        ...rest,
        headers: reqHeaders,
      });
    } catch (primaryError: any) {
      // Cloud failover is a hosted-build safety net only. From a dev machine it would
      // silently read and write the public Back4App dataset instead of the local one.
      if (!url.startsWith(LIVE_BACKEND_URL) && typeof window !== 'undefined' && !isLocalDev()) {
        try {
          console.warn(`[ApiClient] Primary fetch failed (${primaryError.message}). Attempting direct failover to Back4App cloud backend...`);
          const fallbackUrl = `${LIVE_BACKEND_URL}${cleanEndpoint}`;
          response = await fetch(fallbackUrl, {
            ...rest,
            headers: reqHeaders,
          });
        } catch (fallbackError: any) {
          console.error(`[ApiClient Failover Error] ${endpoint}:`, fallbackError.message);
          throw new Error('Backend service is waking up. Please retry in a few moments.');
        }
      } else if (isLocalDev()) {
        console.error(`[ApiClient] Local ${cleanEndpoint} request failed:`, primaryError.message);
        throw new Error('The local serverless API did not answer. Is `npm run dev` running on port 3000?');
      } else {
        throw new Error('Backend service is waking up. Please retry in a few moments.');
      }
    }

    // Special check for CSV downloads
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/csv')) {
      return (await response.text()) as unknown as T;
    }

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = json?.message || `HTTP ${response.status}: An error occurred while processing request`;
      if (response.status === 401 && typeof window !== 'undefined') {
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('cnhs_access_token');
          localStorage.removeItem('cnhs_refresh_token');
          localStorage.removeItem('cnhs_user');
        }
      }
      throw new Error(errorMsg);
    }

    return json.data !== undefined ? json.data : json;
  }

  public static get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  public static post<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public static put<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public static delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
