import { WebPlugin, Capacitor } from '@capacitor/core';
import type { DeviceInfoPlugin, DeviceInfoExtended } from './deviceInfo';

export class DeviceInfoWeb extends WebPlugin implements DeviceInfoPlugin {
  async getExtendedInfo(): Promise<DeviceInfoExtended> {
    const platform = Capacitor.getPlatform();
    
    // Get device info from Capacitor
    const info = await Capacitor.getInfo();
    
    // Build device model string
    let deviceModel = 'Web Browser';
    
    if (platform === 'ios') {
      // iOS: "iPhone (iOS 18.7)" ou "iPad (iOS 18.7)"
      deviceModel = `${info.model || 'iPhone'} (iOS ${info.osVersion || 'Unknown'})`;
      console.log('[DeviceInfoWeb] iOS device:', deviceModel);
    } else if (platform === 'android') {
      // Android: Usa plugin nativo (não chega aqui)
      deviceModel = `Android ${info.osVersion || 'Unknown'}`;
    } else {
      // Web: User-Agent
      deviceModel = navigator.userAgent;
    }
    
    // Get battery info if available
    let batteryLevel = 100;
    let isCharging = false;
    
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        batteryLevel = Math.round(battery.level * 100);
        isCharging = battery.charging;
      } catch (error) {
        console.log('[DeviceInfoWeb] Battery API not available:', error);
      }
    }
    
    // Get timezone info
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneOffsetMinutes = -new Date().getTimezoneOffset(); // Inverte sinal (getTimezoneOffset retorna negativo para GMT+)
    
    return {
      deviceModel,
      batteryLevel,
      isCharging,
      androidVersion: platform === 'android' ? (info.osVersion || 'N/A') : 'N/A',
      iosVersion: platform === 'ios' ? info.osVersion : undefined,
      appVersion: info.appVersion || '1.0.0',
      isIgnoringBatteryOptimization: true, // iOS não precisa
      connectionType: navigator.onLine ? 'wifi' : 'none',
      wifiSignalStrength: null,
      timezone,
      timezoneOffsetMinutes,
    };
  }
}
