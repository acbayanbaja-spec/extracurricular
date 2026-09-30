import { toast } from 'sonner';

export const LIVE_BACKEND_URL = 'https://extracurricular-sc5rlfdq.b4a.run/api';

export function getBaseApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  // If in browser context
  if (typeof window !== 'undefined') {
    const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // If running in production (Vercel or custom domain)
    if (!isLocalHost) {
      if (envUrl && !envUrl.includes('localhost')) {
        return envUrl.replace(/\/$/, '');
      }
      return LIVE_BACKEND_URL;
    }
  }

  // Local development fallback
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

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

    let url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

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
      // Automatic Cloud Failover: if localhost or primary URL fails in browser, retry against live cloud backend
      if (!url.startsWith(LIVE_BACKEND_URL) && typeof window !== 'undefined') {
        try {
          console.warn(`[ApiClient] Primary fetch failed (${primaryError.message}). Attempting failover to live cloud backend...`);
          const fallbackUrl = `${LIVE_BACKEND_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
          response = await fetch(fallbackUrl, {
            ...rest,
            headers: reqHeaders,
          });
        } catch (fallbackError: any) {
          console.error(`[ApiClient Failover Error] ${endpoint}:`, fallbackError.message);
          throw new Error('Connection failed: Unable to connect to CNHS API service. Please verify your internet connection.');
        }
      } else {
        throw new Error('Connection failed: Unable to connect to CNHS API service. Please verify your internet connection.');
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
