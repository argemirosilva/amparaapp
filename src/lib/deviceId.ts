// ============================================
// Device ID Management
// ============================================
// Generates and persists a unique device identifier

import { STORAGE_KEYS, DeviceInfo } from './types';
import { Capacitor } from '@capacitor/core';

// Track initialization status
let initializationPromise: Promise<void> | null = null;
let isInitialized = false;

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Initialize device ID from native platform (iOS Keychain)
 * Call this once at app startup before using getDeviceId()
 */
export async function initializeDeviceId(): Promise<void> {
  // If already initializing or initialized, return existing promise
  if (initializationPromise) {
    return initializationPromise;
  }

  // Create initialization promise
  initializationPromise = (async () => {
    if (!Capacitor.isNativePlatform()) {
      console.log('[DeviceId] Not on native platform, skipping initialization');
      isInitialized = true;
      return;
    }

    try {
      const { AudioTriggerNative } = await import('@/plugins/audioTriggerNative');
      const result = await AudioTriggerNative.getDeviceId();

      if (result && result.deviceId) {
        console.log('[DeviceId] ✅ Synced device_id from iOS Keychain:', result.deviceId);

        // Save to localStorage for synchronous access
        const deviceInfo: DeviceInfo = {
          device_id: result.deviceId,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEYS.DEVICE_ID, JSON.stringify(deviceInfo));
      }
    } catch (error) {
      console.warn('[DeviceId] ⚠️ Failed to sync device_id from native:', error);
    } finally {
      isInitialized = true;
    }
  })();

  return initializationPromise;
}

/**
 * Get or create the device ID (synchronous)
 * IMPORTANT: Call initializeDeviceId() first on app startup for iOS sync
 * The device ID is persisted in localStorage and sent with all API requests
 */
export function getDeviceId(): string {
  // Warn if called before initialization on native platform
  if (Capacitor.isNativePlatform() && !isInitialized) {
    console.warn('[DeviceId] ⚠️ getDeviceId() called before initializeDeviceId() completed on iOS! This may cause device mismatch.');
  }

  const stored = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);

  if (stored) {
    try {
      const deviceInfo: DeviceInfo = JSON.parse(stored);
      console.log('[DeviceId] 📱 Using device_id from localStorage:', deviceInfo.device_id);
      return deviceInfo.device_id;
    } catch {
      console.warn('[DeviceId] ⚠️ Corrupted device_id in localStorage, will regenerate');
      // Corrupted data, regenerate
    }
  }

  // CRITICAL: On iOS, if localStorage is empty but we're on native platform,
  // this means initializeDeviceId() hasn't completed yet or localStorage was cleared
  if (Capacitor.isNativePlatform() && !isInitialized) {
    console.error('[DeviceId] ❌ CRITICAL: localStorage empty AND not initialized on iOS! Cannot generate device_id safely. Returning empty string to trigger error.');
    // Return empty to force error and prevent wrong device_id
    return '';
  }

  // Generate new device ID (only for web or after initialization failed)
  const deviceInfo: DeviceInfo = {
    device_id: generateUUID(),
    created_at: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEYS.DEVICE_ID, JSON.stringify(deviceInfo));

  console.log('[DeviceId] 🆔 Generated new device_id:', deviceInfo.device_id);

  return deviceInfo.device_id;
}

/**
 * Get device info with creation timestamp
 */
export function getDeviceInfo(): DeviceInfo {
  const stored = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through to create new
    }
  }
  
  // Create and store new device info
  const deviceInfo: DeviceInfo = {
    device_id: generateUUID(),
    created_at: new Date().toISOString(),
  };
  
  localStorage.setItem(STORAGE_KEYS.DEVICE_ID, JSON.stringify(deviceInfo));
  
  return deviceInfo;
}

/**
 * Clear device ID (useful for testing or factory reset)
 */
export function clearDeviceId(): void {
  localStorage.removeItem(STORAGE_KEYS.DEVICE_ID);
  isInitialized = false;
  initializationPromise = null;
  console.log('[DeviceId] 🗑️ Cleared device_id from localStorage');
}

/**
 * Force re-sync device_id from iOS Keychain
 * Use this when getting device mismatch errors (403)
 */
export async function resyncDeviceId(): Promise<string> {
  console.log('[DeviceId] 🔄 Force re-syncing device_id from iOS Keychain...');

  // Clear existing state
  isInitialized = false;
  initializationPromise = null;

  // Re-initialize
  await initializeDeviceId();

  // Return the synced ID
  const deviceId = getDeviceId();
  console.log('[DeviceId] ✅ Re-synced device_id:', deviceId);

  return deviceId;
}
