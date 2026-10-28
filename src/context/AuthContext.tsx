import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, LoginResult } from '@/services/api/types';
import { sendOtpApi, loginApi } from '@/services/api/auth';
import { secureStorage, STORAGE_KEYS } from '@/services/storage/secure-storage';
import { resetVerificationAttempts } from '@/utils/security';

export interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  isDriver: boolean;
  isAdmin: boolean;
  isLeadDriver: boolean;
  tokenExpireDate: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendOtp: (mobile: string) => Promise<{ success: boolean; message: string }>;
  login: (mobile: string, code: string) => Promise<{ success: boolean; message: string; user?: AuthUser }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isDriver, setIsDriver] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLeadDriver, setIsLeadDriver] = useState<boolean>(false);
  const [tokenExpireDate, setTokenExpireDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session from persistent secure storage
  useEffect(() => {
    async function restoreSession() {
      try {
        const [savedToken, savedUserJson, savedExpire] = await Promise.all([
          secureStorage.getItem(STORAGE_KEYS.TOKEN),
          secureStorage.getItem(STORAGE_KEYS.USER),
          secureStorage.getItem(STORAGE_KEYS.EXPIRE),
        ]);

        if (savedToken && savedUserJson) {
          // Check if token has expired
          if (savedExpire) {
            const expireTimestamp = new Date(savedExpire).getTime();
            if (!isNaN(expireTimestamp) && expireTimestamp <= Date.now()) {
              console.log('[AuthContext] Stored token has expired. Clearing session.');
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
          setToken(savedToken);
          setUser(parsedUser);
          setTokenExpireDate(savedExpire);
          
          // Determine driver/admin roles
          const hasDriverRole = parsedUser.userRoles?.some(
            (r) => r.role?.name?.toLowerCase().includes('driver')
          ) || parsedUser.driverId !== null;
          const hasAdminRole = parsedUser.userRoles?.some(
            (r) => r.role?.name?.toLowerCase().includes('admin')
          );
          setIsDriver(hasDriverRole);
          setIsAdmin(hasAdminRole);
        }
      } catch (error) {
        console.warn('[AuthContext] Error restoring session:', error);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  /**
   * Request OTP SMS
   */
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

  /**
   * Verify OTP and Login
   */
  const login = useCallback(
    async (mobile: string, code: string): Promise<{ success: boolean; message: string; user?: AuthUser }> => {
      try {
        const response = await loginApi(mobile, code);
        const result: LoginResult = response.result;

        if (!result || !result.token) {
          throw new Error('پاسخ نامعتبر از سرور دریافت شد.');
        }

        // Persist session to secure hardware storage
        await Promise.all([
          secureStorage.setItem(STORAGE_KEYS.TOKEN, result.token),
          secureStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.user)),
          secureStorage.setItem(STORAGE_KEYS.EXPIRE, result.tokenExpireDate || ''),
        ]);

        // Reset anti-brute force counters for this mobile
        resetVerificationAttempts(mobile);

        // Update state
        setToken(result.token);
        setUser(result.user);
        setIsDriver(Boolean(result.isDriver));
        setIsAdmin(Boolean(result.isAdmin));
        setIsLeadDriver(Boolean(result.isLeadDriver));
        setTokenExpireDate(result.tokenExpireDate);

        return {
          success: true,
          message: 'ورود با موفقیت انجام شد.',
          user: result.user,
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

  /**
   * Logout and clear all storage
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await Promise.all([
        secureStorage.removeItem(STORAGE_KEYS.TOKEN),
        secureStorage.removeItem(STORAGE_KEYS.USER),
        secureStorage.removeItem(STORAGE_KEYS.EXPIRE),
      ]);
    } catch (error) {
      console.warn('[AuthContext] Error during logout cleanup:', error);
    } finally {
      setToken(null);
      setUser(null);
      setIsDriver(false);
      setIsAdmin(false);
      setIsLeadDriver(false);
      setTokenExpireDate(null);
    }
  }, []);

  const value: AuthContextType = {
    token,
    user,
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
