import { apiClient } from './client';
import { ApiResponse, LoginResult, SendOtpRequest, LoginRequest } from './types';

/**
 * Send OTP verification code to mobile number
 * Endpoint: POST /api/Auth/send-otp
 */
export async function sendOtpApi(mobile: string): Promise<ApiResponse<number>> {
  return apiClient<number>('/api/Auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile } as SendOtpRequest),
  });
}

/**
 * Verify OTP and login driver
 * Endpoint: POST /api/Auth/login
 */
export async function loginApi(
  mobile: string,
  code: string
): Promise<ApiResponse<LoginResult>> {
  return apiClient<LoginResult>('/api/Auth/login', {
    method: 'POST',
    body: JSON.stringify({ mobile, code } as LoginRequest),
  });
}
