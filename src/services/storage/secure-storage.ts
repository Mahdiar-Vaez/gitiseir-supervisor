import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Storage keys for driver authentication data
 */
export const STORAGE_KEYS = {
  TOKEN: 'gitiseir_auth_token',
  USER: 'gitiseir_auth_user',
  EXPIRE: 'gitiseir_token_expire',
} as const;

export interface StorageAdapter {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
}

// In-memory fallback for environments without SecureStore or localStorage
const memoryStore = new Map<string, string>();

/**
 * Cross-platform Secure Storage Adapter
 * - iOS: Keychain
 * - Android: EncryptedSharedPreferences (KeyStore)
 * - Web: window.localStorage with fallback to memory
 */
export const secureStorage: StorageAdapter = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        } else {
          memoryStore.set(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      console.warn(`[secureStorage] Failed to set key "${key}":`, error);
      memoryStore.set(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return memoryStore.get(key) ?? null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn(`[secureStorage] Failed to get key "${key}":`, error);
      return memoryStore.get(key) ?? null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        memoryStore.delete(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn(`[secureStorage] Failed to remove key "${key}":`, error);
      memoryStore.delete(key);
    }
  },
};
