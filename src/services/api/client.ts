import { ApiResponse } from './types';

export const API_BASE_URL = 'https://backend.vaezprojects.ir';

export class ApiError extends Error {
  statusCode: number;
  data: any;

  constructor(message: string, statusCode = 500, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  token?: string | null;
}

/**
 * Base HTTP request utility with timeout, error extraction, and authorization support
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { timeoutMs = 15000, token, ...customConfig } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(customConfig.headers as Record<string, string> || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...customConfig,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch {
      throw new ApiError(
        'خطایی در دریافت پاسخ از سرور رخ داد.',
        response.status
      );
    }

    // Inspect server response payload: some endpoints return HTTP 200 with success: false
    if (!response.ok || (data && data.success === false)) {
      const errorMsg =
        data?.message ||
        (response.status === 401
          ? 'کد یا شماره اشتباه است یا منقضی شده.'
          : response.status === 404
          ? 'سرویس مورد نظر یافت نشد.'
          : response.status >= 500
          ? 'خطای سرور. لطفاً بعداً تلاش کنید.'
          : 'عملیات با خطا مواجه شد.');

      throw new ApiError(errorMsg, data?.statusCode || response.status, data);
    }

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new ApiError('زمان انتظار برای پاسخ سرور به پایان رسید.', 408);
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      error?.message || 'خطای غیرمنتظره در اتصال به اینترنت رخ داد.',
      500
    );
  }
}
