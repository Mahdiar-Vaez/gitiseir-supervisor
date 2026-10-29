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
 * Helper to safely parse JSON string for structured console logging
 */
function parseBodyForLog(body: any): any {
  if (!body) return null;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return body;
}

/**
 * Base HTTP request utility with timeout, error extraction, full request/response logging, and authorization support
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { timeoutMs = 15000, token, ...customConfig } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const method = (customConfig.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...((customConfig.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const startTime = Date.now();
  const parsedBody = parseBodyForLog(customConfig.body);

  console.log(
    `\n==================== [API REQUEST] ====================\n` +
      `Method  : ${method}\n` +
      `URL     : ${url}\n` +
      `Auth    : ${token ? `Bearer ${token.slice(0, 15)}...` : 'None'}\n` +
      `Headers : ${JSON.stringify(headers)}\n` +
      `Body    : ${parsedBody ? JSON.stringify(parsedBody, null, 2) : 'None'}\n` +
      `=======================================================`
  );

  try {
    const response = await fetch(url, {
      ...customConfig,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;

    let data: ApiResponse<T>;
    const rawText = await response.text();
    try {
      data = rawText ? JSON.parse(rawText) : ({} as ApiResponse<T>);
    } catch {
      console.log(
        `\n==================== [API PARSE ERROR] ================\n` +
          `Method   : ${method}\n` +
          `URL      : ${url}\n` +
          `Status   : ${response.status} (${durationMs}ms)\n` +
          `Raw Body : ${rawText || '(empty)'}\n` +
          `=======================================================`
      );
      throw new ApiError(
        'خطایی در دریافت پاسخ از سرور رخ داد.',
        response.status
      );
    }

    console.log(
      `\n==================== [API RESPONSE] ===================\n` +
        `Method   : ${method}\n` +
        `URL      : ${url}\n` +
        `Status   : ${response.status} (${durationMs}ms)\n` +
        `Response : ${JSON.stringify(data, null, 2)}\n` +
        `=======================================================`
    );

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
    const durationMs = Date.now() - startTime;

    console.log(
      `\n==================== [API ERROR] ======================\n` +
        `Method  : ${method}\n` +
        `URL     : ${url}\n` +
        `Status  : ${error?.statusCode || 'Network/Timeout'} (${durationMs}ms)\n` +
        `Message : ${error?.message || 'Unknown error'}\n` +
        `Data    : ${error?.data ? JSON.stringify(error.data, null, 2) : 'None'}\n` +
        `=======================================================`
    );

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
