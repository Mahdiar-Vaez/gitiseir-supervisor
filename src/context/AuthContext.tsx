import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, LoginResult } from '@/services/api/types';
import { sendOtpApi, loginApi } from '@/services/api/auth';
import { secureStorage, STORAGE_KEYS } from '@/services/storage/secure-storage';
import { resetVerificationAttempts } from '@/utils/security';

export interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  companyServiceId: number | null;
  isDriver: boolean;
  isAdmin: boolean;
  isLeadDriver: boolean;
  tokenExpireDate: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendOtp: (mobile: string) => Promise<{ success: boolean; message: string }>;
  login: (
    mobile: string,
    code: string
  ) => Promise<{ success: boolean; message: string; user?: AuthUser }>;
  logout: () => Promise<void>;
}

function extractCompanyServiceIdFromJwt(jwtToken?: string | null): number | null {
  if (!jwtToken) return null;
  try {
    const parts = jwtToken.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const globalBuffer = (globalThis as Record<string, any>).Buffer;
    const decoded =
      typeof atob === 'function'
        ? atob(padded)
        : globalBuffer
        ? globalBuffer.from(padded, 'base64').toString('utf8')
        : '';
    if (!decoded) return null;
    const payload = JSON.parse(decoded);
    const raw =
      payload?.CompanyServiceId ??
      payload?.companyServiceId ??
      payload?.CompanyServiceLocationId;
    const num = Number(raw);
    return !Number.isNaN(num) && num > 0 ? num : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [companyServiceId, setCompanyServiceId] = useState<number | null>(null);
  const [isDriver, setIsDriver] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLeadDriver, setIsLeadDriver] = useState<boolean>(true);
  const [tokenExpireDate, setTokenExpireDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const [savedToken, savedUserJson, savedExpire] = await Promise.all([
          secureStorage.getItem(STORAGE_KEYS.TOKEN),
          secureStorage.getItem(STORAGE_KEYS.USER),
          secureStorage.getItem(STORAGE_KEYS.EXPIRE),
        ]);

        if (savedToken && savedUserJson) {
          if (savedExpire) {
            const expireTimestamp = new Date(savedExpire).getTime();
            if (!isNaN(expireTimestamp) && expireTimestamp <= Date.now()) {
              await Promise.all([
                secureStorage.removeItem(STORAGE_KEYS.TOKEN),
                secureStorage.removeItem(STORAGE_KEYS.USER),
                secureStorage.removeItem(STORAGE_KEYS.EXPIRE),
              ]);
              setIsLoading(false);
              return;
            }
          }

          const parsedUser = JSON.parse(savedUserJson) as AuthUser;
          const resolvedServiceId =
            (parsedUser?.companyServiceId && Number(parsedUser.companyServiceId) > 0
              ? Number(parsedUser.companyServiceId)
              : null) ?? extractCompanyServiceIdFromJwt(savedToken);

          const enrichedUser: AuthUser = {
            ...parsedUser,
            companyServiceId: resolvedServiceId,
          };

          setToken(savedToken);
          setUser(enrichedUser);
          setCompanyServiceId(resolvedServiceId);
          setTokenExpireDate(savedExpire);
          setIsLeadDriver(true);
        }
      } catch (error) {
        console.log('[AuthContext] Error restoring session:', error);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const sendOtp = useCallback(async (mobile: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await sendOtpApi(mobile);
      return {
        success: response.success,
        message: response.message || 'کد با موفقیت ارسال شد.',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'خطا در ارسال کد تایید.',
      };
    }
  }, []);

  const login = useCallback(
    async (
      mobile: string,
      code: string
    ): Promise<{ success: boolean; message: string; user?: AuthUser }> => {
      try {
        const response = await loginApi(mobile, code);
        const result: LoginResult = response.result;

        if (!result || !result.token) {
          throw new Error('پاسخ نامعتبر از سرور دریافت شد.');
        }

        const resolvedServiceId =
          (result.companyServiceId && Number(result.companyServiceId) > 0
            ? Number(result.companyServiceId)
            : null) ??
          (result.user?.companyServiceId && Number(result.user.companyServiceId) > 0
            ? Number(result.user.companyServiceId)
            : null) ??
          extractCompanyServiceIdFromJwt(result.token);

        const enrichedUser: AuthUser = {
          ...result.user,
          companyServiceId: resolvedServiceId,
        };

        await Promise.all([
          secureStorage.setItem(STORAGE_KEYS.TOKEN, result.token),
          secureStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(enrichedUser)),
          secureStorage.setItem(STORAGE_KEYS.EXPIRE, result.tokenExpireDate || ''),
        ]);

        resetVerificationAttempts(mobile);

        setToken(result.token);
        setUser(enrichedUser);
        setCompanyServiceId(resolvedServiceId);
        setIsDriver(Boolean(result.isDriver));
        setIsAdmin(Boolean(result.isAdmin));
        setIsLeadDriver(true);
        setTokenExpireDate(result.tokenExpireDate);

        return {
          success: true,
          message: 'ورود به سامانه سرشوفر با موفقیت انجام شد.',
          user: enrichedUser,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || 'کد تایید نامعتبر است.',
        };
      }
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await Promise.all([
        secureStorage.removeItem(STORAGE_KEYS.TOKEN),
        secureStorage.removeItem(STORAGE_KEYS.USER),
        secureStorage.removeItem(STORAGE_KEYS.EXPIRE),
      ]);
    } catch (error) {
      console.log('[AuthContext] Error during logout cleanup:', error);
    } finally {
      setToken(null);
      setUser(null);
      setCompanyServiceId(null);
      setIsDriver(false);
      setIsAdmin(false);
      setIsLeadDriver(false);
      setTokenExpireDate(null);
    }
  }, []);

  const value: AuthContextType = {
    token,
    user,
    companyServiceId,
    isDriver,
    isAdmin,
    isLeadDriver,
    tokenExpireDate,
    isAuthenticated: Boolean(token && user),
    isLoading,
    sendOtp,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
