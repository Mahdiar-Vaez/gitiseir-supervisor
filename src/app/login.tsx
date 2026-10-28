import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Phone,
  KeyRound,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sun,
  Moon,
  Edit2,
  ShieldCheck,
} from 'lucide-react-native';

import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useOtpTimer } from '@/hooks/useOtpTimer';
import {
  normalizeDigits,
  normalizeIranMobile,
  isValidIranMobile,
} from '@/utils/security';
import { toPersianDigits } from '@/utils/persian-digits';

export default function LoginScreen() {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const { sendOtp, login } = useAuth();

  // Step 1: 'mobile', Step 2: 'otp'
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobileInput, setMobileInput] = useState<string>('09043793424');
  const [otpInput, setOtpInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Keyboard and focus tracking for auto-avoiding keyboard overlap
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  const otpInputRef = useRef<any>(null);
  const scrollViewRef = useRef<any>(null);

  // Track native keyboard show/hide events
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const isKeyboardOpen = keyboardVisible || isInputFocused;

  // Cooldown and anti-brute force timer hook
  const {
    formattedTime,
    canResend,
    isLocked,
    formattedLockTime,
    startCooldown,
    recordFailure,
    resetLockout,
  } = useOtpTimer(normalizeIranMobile(mobileInput));

  // Clear messages on input change
  const handleMobileChange = (val: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setMobileInput(val);
  };

  const handleOtpChange = (val: string) => {
    setErrorMessage(null);
    const cleaned = normalizeDigits(val).replace(/\D/g, '').slice(0, 6);
    setOtpInput(cleaned);

    // Auto-submit when user reaches 6 digits or SMS autofills
    if (cleaned.length === 6 && !isSubmitting && !isLocked) {
      setTimeout(() => {
        handleVerifyOtp(cleaned);
      }, 150);
    }
  };

  // Step 1: Submit Mobile Number
  const handleRequestOtp = async () => {
    if (isSubmitting) return;

    const normalized = normalizeIranMobile(mobileInput);
    if (!isValidIranMobile(normalized)) {
      setErrorMessage('لطفاً شماره تلفن همراه معتبر وارد کنید (مثال: ۰۹۱۲۳۴۵۶۷۸۹)');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (isLocked) {
      setErrorMessage(
        `تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً ${formattedLockTime} دیگر صبور باشید.`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await sendOtp(normalized);
      if (res.success) {
        setSuccessMessage(res.message);
        startCooldown(120); // 120s cooldown
        setStep('otp');
        setOtpInput('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Focus OTP field and scroll into view smoothly
        setTimeout(() => {
          otpInputRef.current?.focus();
          scrollViewRef.current?.scrollTo({ y: 70, animated: true });
        }, 300);
      } else {
        setErrorMessage(res.message || 'خطا در ارسال کد تایید.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setErrorMessage('خطای ارتباط با سرور. لطفاً اتصال اینترنت را بررسی کنید.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpInput;
    if (isSubmitting) return;

    if (!code || code.length !== 6) {
      setErrorMessage('لطفاً کد تایید ۶ رقمی را وارد کنید.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (isLocked) {
      setErrorMessage(
        `حساب به طور موقت قفل شده است. لطفاً ${formattedLockTime} دیگر تلاش کنید.`
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const normalized = normalizeIranMobile(mobileInput);
    try {
      const res = await login(normalized, code);

      if (res.success) {
        setSuccessMessage('ورود با موفقیت انجام شد. در حال ورود...');
        resetLockout();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // Record failed attempt for brute-force protection
        const nowLocked = recordFailure();
        if (nowLocked) {
          setErrorMessage(
            `تعداد تلاش‌های نادرست به سقف مجاز رسید. ارسال درخواست به مدت ${formattedLockTime} قفل شد.`
          );
        } else {
          setErrorMessage(res.message || 'کد تایید اشتباه است.');
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setErrorMessage('خطای ارتباط با سرور. لطفاً مجدداً تلاش نمایید.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : Platform.OS === 'android'
              ? 'height'
              : undefined
          }
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[
              styles.scrollContent,
              isKeyboardOpen && styles.scrollContentKeyboard,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Top Header Bar */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={toggleTheme}
                accessibilityLabel="تغییر تم"
              >
                {isDark ? (
                  <Sun size={18} color="#D4AF37" />
                ) : (
                  <Moon size={18} color="#D4AF37" />
                )}
              </TouchableOpacity>

              <View style={styles.brandBadge}>
                <Text style={[styles.brandBadgeText, { color: colors.gold }]}>
                  گیتی‌سیر
                </Text>
              </View>
            </View>

            {/* Luxury Logo & Emblem - dynamically adapts when keyboard opens */}
            <View
              style={[
                styles.emblemContainer,
                isKeyboardOpen && styles.emblemContainerCompact,
              ]}
            >
              <View
                style={[
                  styles.emblemRing,
                  isKeyboardOpen && styles.emblemRingCompact,
                  {
                    borderColor: 'rgba(212, 175, 55, 0.4)',
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  },
                ]}
              >
                <ShieldCheck
                  size={isKeyboardOpen ? 22 : 40}
                  color={colors.gold}
                  strokeWidth={1.8}
                />
              </View>

              <Text
                style={[
                  styles.mainTitle,
                  isKeyboardOpen && styles.mainTitleCompact,
                  { color: colors.text },
                ]}
              >
                سامانه رانندگان گیتی‌سیر
              </Text>

              {!isKeyboardOpen && (
                <Text
                  style={[styles.mainSubtitle, { color: colors.textSecondary }]}
                >
                  {step === 'mobile'
                    ? 'برای ورود به حساب کاربری، شماره تلفن همراه خود را وارد کنید'
                    : 'کد تایید ۶ رقمی پیامک‌شده را وارد کنید یا منتظر جایگذاری خودکار بمانید'}
                </Text>
              )}
            </View>

            {/* Error / Success Feedback Banners */}
            {errorMessage && (
              <View
                style={[
                  styles.banner,
                  styles.bannerError,
                  {
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    borderColor: 'rgba(239, 68, 68, 0.35)',
                  },
                ]}
              >
                <AlertTriangle size={18} color="#EF4444" style={styles.bannerIcon} />
                <Text style={styles.bannerErrorText}>{errorMessage}</Text>
              </View>
            )}

            {successMessage && (
              <View
                style={[
                  styles.banner,
                  styles.bannerSuccess,
                  {
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    borderColor: 'rgba(16, 185, 129, 0.35)',
                  },
                ]}
              >
                <CheckCircle2 size={18} color="#10B981" style={styles.bannerIcon} />
                <Text style={styles.bannerSuccessText}>{successMessage}</Text>
              </View>
            )}

            {/* Step 1: Mobile Input Card */}
            {step === 'mobile' ? (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  شماره تلفن همراه
                </Text>

                <View
                  style={[
                    styles.inputRow,
                    {
                      backgroundColor: isDark ? '#0B0F19' : '#F4EFEA',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        color: colors.text,
                        textAlign: 'left',
                        writingDirection: 'ltr',
                      },
                    ]}
                    value={toPersianDigits(mobileInput)}
                    onChangeText={handleMobileChange}
                    keyboardType="phone-pad"
                    maxLength={11}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    placeholderTextColor={
                      isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(15, 23, 42, 0.28)'
                    }
                    onFocus={() => {
                      setIsInputFocused(true);
                      setTimeout(() => {
                        scrollViewRef.current?.scrollTo({ y: 50, animated: true });
                      }, 100);
                    }}
                    onBlur={() => setIsInputFocused(false)}
                    autoFocus
                  />
                  <Phone size={20} color={colors.gold} style={styles.inputIcon} />
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor: colors.gold,
                      opacity: isSubmitting || !isValidIranMobile(mobileInput) ? 0.6 : 1,
                    },
                  ]}
                  onPress={handleRequestOtp}
                  disabled={isSubmitting || !isValidIranMobile(mobileInput)}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#0B0F19" size="small" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>دریافت کد تایید</Text>
                      <ArrowRight size={18} color="#0B0F19" style={{ marginRight: 6 }} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* Step 2: OTP Verification Card */
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Phone Info & Edit */}
                <View style={styles.phoneSummaryRow}>
                  <TouchableOpacity
                    style={styles.editPhoneBtn}
                    onPress={() => {
                      setStep('mobile');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                  >
                    <Edit2 size={14} color={colors.gold} />
                    <Text style={[styles.editPhoneText, { color: colors.gold }]}>
                      تغییر شماره
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.phoneDisplay}>
                    <Text style={[styles.phoneDisplayText, { color: colors.text }]}>
                      {toPersianDigits(normalizeIranMobile(mobileInput))}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  کد تایید پیامکی (ورود خودکار فعال است)
                </Text>

                {/* OTP Digit Boxes Visualization with Full Overlay Input */}
                <View style={styles.otpWrapper}>
                  <View style={styles.otpBoxesRow} pointerEvents="none">
                    {[0, 1, 2, 3, 4, 5].map((idx) => {
                      const digit = otpInput[idx] || '';
                      const isCurrent = otpInput.length === idx;
                      return (
                        <View
                          key={idx}
                          style={[
                            styles.otpBox,
                            {
                              backgroundColor: isDark ? '#0B0F19' : '#F4EFEA',
                              borderColor: isCurrent
                                ? colors.gold
                                : digit
                                ? colors.gold
                                : colors.border,
                            },
                          ]}
                        >
                          <Text style={[styles.otpBoxText, { color: colors.text }]}>
                            {digit ? toPersianDigits(digit) : ''}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Native Full-Overlay TextInput: Covers the entire box area reliably */}
                  <TextInput
                    ref={otpInputRef}
                    style={styles.fullOverlayInput}
                    value={otpInput}
                    onChangeText={handleOtpChange}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                    inputMode="numeric"
                    maxLength={6}
                    onFocus={() => {
                      setIsInputFocused(true);
                      setTimeout(() => {
                        scrollViewRef.current?.scrollTo({ y: 70, animated: true });
                      }, 100);
                    }}
                    onBlur={() => setIsInputFocused(false)}
                    autoFocus
                  />
                </View>

                {/* Resend Cooldown Timer / Button */}
                <View style={styles.timerRow}>
                  {canResend ? (
                    <TouchableOpacity
                      onPress={handleRequestOtp}
                      disabled={isSubmitting}
                      style={styles.resendBtn}
                    >
                      <Text style={[styles.resendBtnText, { color: colors.gold }]}>
                        ارسال مجدد کد تایید
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.timerCounter}>
                      <Clock size={16} color={colors.textSecondary} style={{ marginLeft: 6 }} />
                      <Text style={[styles.timerText, { color: colors.textSecondary }]}>
                        ارسال مجدد کد تا{' '}
                        <Text style={{ color: colors.gold, fontWeight: '700' }}>
                          {formattedTime}
                        </Text>{' '}
                        دیگر
                      </Text>
                    </View>
                  )}
                </View>

                {/* Verify & Enter Button */}
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor: colors.gold,
                      opacity: isSubmitting || otpInput.length !== 6 || isLocked ? 0.6 : 1,
                    },
                  ]}
                  onPress={() => handleVerifyOtp()}
                  disabled={isSubmitting || otpInput.length !== 6 || isLocked}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#0B0F19" size="small" />
                  ) : (
                    <>
                      <KeyRound size={18} color="#0B0F19" style={{ marginLeft: 8 }} />
                      <Text style={styles.primaryBtnText}>تایید و ورود به برنامه</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Footer note */}
            {!isKeyboardOpen && (
              <View style={styles.footerNote}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  پشتیبانی گیتی‌سیر: ۰۲۱-۸۸۸۸۸۸۸۸
                </Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
    justifyContent: 'center',
  },
  scrollContentKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 10,
    paddingBottom: 220,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 6,
  },
  themeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  brandBadgeText: {
    fontFamily: 'Vazirmatn_700Bold',
    fontSize: 14,
  },
  emblemContainer: {
    alignItems: 'center',
    marginBottom: 26,
  },
  emblemContainerCompact: {
    marginBottom: 10,
  },
  emblemRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  emblemRingCompact: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginBottom: 6,
  },
  mainTitle: {
    fontFamily: 'Vazirmatn_700Bold',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  mainTitleCompact: {
    fontSize: 17,
    marginBottom: 4,
  },
  mainSubtitle: {
    fontFamily: 'Vazirmatn_400Regular',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  banner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  bannerError: {},
  bannerSuccess: {},
  bannerIcon: {
    marginLeft: 8,
  },
  bannerErrorText: {
    fontFamily: 'Vazirmatn_500Medium',
    fontSize: 13,
    color: '#EF4444',
    flex: 1,
    textAlign: 'right',
  },
  bannerSuccessText: {
    fontFamily: 'Vazirmatn_500Medium',
    fontSize: 13,
    color: '#10B981',
    flex: 1,
    textAlign: 'right',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  inputLabel: {
    fontFamily: 'Vazirmatn_500Medium',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 20,
  },
  inputIcon: {
    marginLeft: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Vazirmatn_600SemiBold',
    fontSize: 16,
    paddingVertical: 0,
    textAlign: 'left',
  },
  primaryBtn: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    fontFamily: 'Vazirmatn_700Bold',
    fontSize: 15,
    color: '#0B0F19',
  },
  phoneSummaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  phoneDisplay: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  phoneDisplayText: {
    fontFamily: 'Vazirmatn_700Bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  editPhoneBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editPhoneText: {
    fontFamily: 'Vazirmatn_500Medium',
    fontSize: 13,
    marginRight: 6,
  },
  otpWrapper: {
    position: 'relative',
    marginVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxText: {
    fontFamily: 'Vazirmatn_700Bold',
    fontSize: 20,
    textAlign: 'center',
  },
  fullOverlayInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
  timerRow: {
    alignItems: 'center',
    marginVertical: 14,
  },
  timerCounter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  timerText: {
    fontFamily: 'Vazirmatn_400Regular',
    fontSize: 13,
  },
  resendBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendBtnText: {
    fontFamily: 'Vazirmatn_600SemiBold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footerNote: {
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontFamily: 'Vazirmatn_400Regular',
    fontSize: 12,
  },
});
