import { Platform } from 'react-native';
import { ApiResponse } from './types';

export const REMOTE_BACKEND_URL = 'http://95.38.176.36:8333';
export const DOMAIN_BACKEND_URL = 'https://backend.vaezprojects.ir';

/**
 * On Web in the browser, using a relative URL (empty base) routes API calls through
 * Vercel's reverse proxy (/api/ -> https://backend.vaezprojects.ir/api/), completely
 * bypassing browser Same-Origin CORS preflight failures.
 * On Native (iOS/Android) or when an explicit EXPO_PUBLIC_API_URL is provided, it uses the direct backend IP or remote domain.
 */
export const API_BASE_URL =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? ''
    : (process.env.EXPO_PUBLIC_API_URL || DOMAIN_BACKEND_URL);

export class ApiError extends Error {
  statusCode: number;
  data: any;
  endpoint: string;

  constructor(message: string, statusCode = 500, data?: any, endpoint = '') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
    this.endpoint = endpoint;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  token?: string | null;
  retries?: number;
}

/**
 * Translates low-level network and DNS errors into user-friendly Persian messages
 */
export function translateNetworkError(rawMessage: string): string {
  const lower = (rawMessage || '').toLowerCase();

  if (
    lower.includes('unknownhostexception') ||
    lower.includes('unable to resolve host') ||
    lower.includes('enotfound') ||
    lower.includes('eai_again')
  ) {
    return 'عدم شناسایی آدرس سرور. لطفاً وضعیت اینترنت، فیلترشکن یا تنظیمات دی‌ان‌اس را بررسی کنید.';
  }

  if (
    lower.includes('aborterror') ||
    lower.includes('timeout') ||
    lower.includes('timed out')
  ) {
    return 'زمان انتظار برای پاسخ سرور به پایان رسید. لطفاً مجدداً تلاش نمایید.';
  }

  if (
    lower.includes('network request failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('econnrefused') ||
    lower.includes('connection refused')
  ) {
    return 'عدم امکان اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.';
  }

  return 'خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.';
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
 * Extract detailed human-readable error message from backend response payload
 */
function extractBackendErrorMessage(data: any, httpStatus: number): string {
  if (data) {
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message.trim();
    }
    if (
      data.result &&
      typeof data.result === 'object' &&
      typeof data.result.message === 'string' &&
      data.result.message.trim()
    ) {
      return data.result.message.trim();
    }
    if (typeof data.errorMessage === 'string' && data.errorMessage.trim()) {
      return data.errorMessage.trim();
    }
    if (typeof data.title === 'string' && data.title.trim()) {
      return data.title.trim();
    }
    if (data.errors && typeof data.errors === 'object') {
      const firstErr = Object.values(data.errors).flat()[0];
      if (typeof firstErr === 'string' && firstErr.trim()) {
        return firstErr.trim();
      }
    }
  }

  const effectiveStatus = data?.statusCode || httpStatus;
  if (effectiveStatus === 401) {
    return 'نشست کاربری منقضی شده یا کد تایید نامعتبر است (۴۰۱).';
  }
  if (effectiveStatus === 403) {
    return 'عدم دسترسی به این سرویس برای نقش کاربری فعلی (۴۰۳).';
  }
  if (effectiveStatus === 404) {
    return 'اطلاعات یا سرویس مورد نظر در سرور یافت نشد (۴۰۴).';
  }
  if (effectiveStatus >= 500) {
    return `خطای داخلی سرور (${effectiveStatus}).`;
  }
  return `عملیات با خطا مواجه شد (کد وضعیت: ${effectiveStatus}).`;
}

/**
 * Base HTTP request utility with timeout, error extraction, full request/response logging, and authorization support
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { timeoutMs = 15000, token, retries = 1, ...customConfig } = options;

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

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http')
    ? endpoint
    : API_BASE_URL
    ? `${API_BASE_URL}${normalizedEndpoint}`
    : normalizedEndpoint;
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
        `پاسخ غیرمعتبر از سرور دریافت شد (کد ${response.status}).`,
        response.status,
        rawText,
        endpoint
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

    if (!response.ok || (data && data.success === false)) {
      const effectiveStatus = data?.statusCode || response.status;
      const errorMsg = extractBackendErrorMessage(data, response.status);
      throw new ApiError(errorMsg, effectiveStatus, data, endpoint);
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

    if (retries > 0 && !(error instanceof ApiError)) {
      const isDnsOrTimeout =
        error.name === 'AbortError' ||
        (typeof error?.message === 'string' &&
          (error.message.includes('UnknownHostException') ||
            error.message.includes('Unable to resolve host') ||
            error.message.includes('fetch failed') ||
            error.message.includes('Network request failed')));

      const targetEndpoint =
        isDnsOrTimeout && url.includes('vaezprojects.ir')
          ? url.replace('https://backend.vaezprojects.ir', REMOTE_BACKEND_URL)
          : endpoint;

      console.log(`[API RETRY] تلاش مجدد برای اتصال (${retries} تلاش باقی‌مانده)...`);
      await new Promise((res) => setTimeout(res, 300));
      return apiClient<T>(targetEndpoint, {
        ...options,
        retries: retries - 1,
      });
    }

    if (error.name === 'AbortError') {
      throw new ApiError(
        'زمان انتظار برای پاسخ سرور به پایان رسید (Timeout).',
        408,
        null,
        endpoint
      );
    }

    if (error instanceof ApiError) {
      throw error;
    }

    const localizedMessage = translateNetworkError(error?.message);
    throw new ApiError(
      localizedMessage,
      500,
      null,
      endpoint
    );
  }
}
