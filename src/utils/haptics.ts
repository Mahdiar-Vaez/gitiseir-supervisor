import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Safe cross-platform Haptics wrapper.
 * Prevents "Uncaught (in promise) Error: The method or property Haptics.* is not available"
 * on Android emulators, web, or unlinked Expo Go runtimes.
 */
export async function triggerSelectionHaptic(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // Ignore silently when native module is unavailable
  }
}

export async function triggerImpactHaptic(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(style);
  } catch {
    // Ignore silently when native module is unavailable
  }
}

export async function triggerNotificationHaptic(
  type:
    | Haptics.NotificationFeedbackType
    | 'success'
    | 'warning'
    | 'error' = Haptics.NotificationFeedbackType.Success
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const mappedType =
      type === 'success'
        ? Haptics.NotificationFeedbackType.Success
        : type === 'warning'
        ? Haptics.NotificationFeedbackType.Warning
        : type === 'error'
        ? Haptics.NotificationFeedbackType.Error
        : type;
    await Haptics.notificationAsync(mappedType);
  } catch {
    // Ignore silently when native module is unavailable
  }
}
