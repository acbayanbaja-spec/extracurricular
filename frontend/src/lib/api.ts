import { toast } from 'sonner';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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

    let url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

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

    try {
      const response = await fetch(url, {
        ...rest,
        headers: reqHeaders,
      });

      // Special check for CSV downloads
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/csv')) {
        return (await response.text()) as unknown as T;
      }

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = json?.message || `HTTP ${response.status}: An error occurred while processing request`;
        if (response.status === 401 && typeof window !== 'undefined') {
          // Token expired, clear and optionally redirect if not already on login
          if (!window.location.pathname.includes('/login')) {
            localStorage.removeItem('cnhs_access_token');
            localStorage.removeItem('cnhs_refresh_token');
            localStorage.removeItem('cnhs_user');
          }
        }
        throw new Error(errorMsg);
      }

      return json.data !== undefined ? json.data : json;
    } catch (error: any) {
      console.error(`[API Request Error] ${endpoint}:`, error.message);
      throw error;
    }
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
