import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import { ApiResponse, LoginResult, SendOtpRequest, LoginRequest } from './types';

/**
 * Send OTP verification code to mobile number
 * Endpoint: POST /api/Auth/send-otp
 */
export async function sendOtpApi(mobile: string): Promise<ApiResponse<number>> {
  return apiClient<number>(API_ENDPOINTS.AUTH.SEND_OTP, {
    method: 'POST',
    body: JSON.stringify({ mobile } as SendOtpRequest),
  });
}

/**
 * Verify OTP and login driver / supervisor
 * Endpoint: POST /api/Auth/login
 */
export async function loginApi(
  mobile: string,
  code: string
): Promise<ApiResponse<LoginResult>> {
  return apiClient<LoginResult>(API_ENDPOINTS.AUTH.LOGIN, {
    method: 'POST',
    body: JSON.stringify({ mobile, code } as LoginRequest),
  });
}
