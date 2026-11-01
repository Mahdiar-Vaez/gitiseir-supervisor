import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type?: ToastType;
  title: string;
  message?: string;
  statusCode?: number;
  duration?: number;
}

interface ActiveToast extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  showSuccess: (first: string, second?: string) => void;
  showError: (first: string, second?: any) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    const id = Date.now();
    const duration =
      options.duration ?? (options.type === 'error' ? 5500 : 4000);

    setToast({
      id,
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      statusCode: options.statusCode,
      duration,
    });

    timerRef.current = setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, duration);
  }, []);

  const showSuccess = useCallback(
    (first: string, second?: string) => {
      if (!second) {
        showToast({ type: 'success', title: 'عملیات موفق', message: first });
        return;
      }
      const isFirstMessage = first.length > second.length + 6;
      showToast({
        type: 'success',
        title: isFirstMessage ? second : first,
        message: isFirstMessage ? first : second,
      });
    },
    [showToast]
  );

  const showError = useCallback(
    (first: string, second?: any) => {
      if (!second) {
        showToast({ type: 'error', title: 'بروز خطا', message: first });
        return;
      }

      if (typeof second === 'string') {
        const isFirstMessage = first.length > second.length + 6;
        showToast({
          type: 'error',
          title: isFirstMessage ? second : first,
          message: isFirstMessage ? first : second,
        });
        return;
      }

      if (typeof second === 'object') {
        const code = second.statusCode;
        const msg =
          second.message ||
          second?.data?.message ||
          second?.data?.result?.message ||
          'خطایی در ارتباط با سرور رخ داد.';
        showToast({
          type: 'error',
          title: first,
          message: msg,
          statusCode: code,
        });
      }
    },
    [showToast]
  );

  const getToastPalette = (type: ToastType = 'info') => {
    switch (type) {
      case 'success':
        return {
          bg: '#064E3B',
          border: '#10B981',
          accent: '#34D399',
          Icon: CheckCircle2,
        };
      case 'error':
        return {
          bg: '#4C0519',
          border: '#F43F5E',
          accent: '#FB7185',
          Icon: AlertCircle,
        };
      case 'warning':
        return {
          bg: '#451A03',
          border: '#F59E0B',
          accent: '#FBBF24',
          Icon: AlertTriangle,
        };
      default:
        return {
          bg: '#0F172A',
          border: '#14B8A6',
          accent: '#14B8A6',
          Icon: Info,
        };
    }
  };

  return (
    <ToastContext.Provider
      value={{ showToast, showSuccess, showError, hideToast }}
    >
      {children}
      {toast ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.wrapper,
            {
              top: Math.max(insets.top, 12) + 8,
            },
          ]}
        >
          {(() => {
            const palette = getToastPalette(toast.type);
            const IconComp = palette.Icon;
            return (
              <View
                style={[
                  styles.toastCard,
                  {
                    backgroundColor: palette.bg,
                    borderColor: palette.border,
                  },
                ]}
              >
                <View style={styles.contentRow}>
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: 'rgba(255,255,255,0.1)' },
                    ]}
                  >
                    <IconComp size={20} color={palette.accent} />
                  </View>

                  <View style={styles.textCol}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.titleText,
                          { fontFamily: Typography.fontFamily.bold },
                        ]}
                      >
                        {toast.title}
                      </Text>
                      {toast.statusCode ? (
                        <View
                          style={[
                            styles.codeBadge,
                            { borderColor: palette.accent },
                          ]}
                        >
                          <Text
                            style={[
                              styles.codeBadgeText,
                              {
                                color: palette.accent,
                                fontFamily: Typography.fontFamily.bold,
                              },
                            ]}
                          >
                            کد {toPersianDigits(toast.statusCode)}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {toast.message ? (
                      <Text
                        style={[
                          styles.messageText,
                          { fontFamily: Typography.fontFamily.regular },
                        ]}
                      >
                        علت / پیام: {toPersianDigits(toast.message)}
                      </Text>
                    ) : null}
                  </View>

                  <Pressable
                    onPress={hideToast}
                    hitSlop={10}
                    style={styles.closeBtn}
                  >
                    <X size={17} color="#E2E8F0" />
                  </Pressable>
                </View>
              </View>
            );
          })()}
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: () => {},
      showSuccess: () => {},
      showError: () => {},
      hideToast: () => {},
    };
  }
  return ctx;
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 99999,
    elevation: 99999,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as any) : {}),
  },
  toastCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 14,
  },
  contentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  textCol: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    textAlign: 'right',
  },
  codeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  codeBadgeText: {
    fontSize: 10.5,
  },
  messageText: {
    color: '#F1F5F9',
    fontSize: 12,
    textAlign: 'right',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
  },
});
