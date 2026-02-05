import { WebPlugin } from '@capacitor/core';
import type { BatteryOptimizationPlugin } from './batteryOptimization';

export class BatteryOptimizationWeb extends WebPlugin implements BatteryOptimizationPlugin {
  async isIgnoringBatteryOptimizations(): Promise<{ isIgnoring: boolean; canScheduleExactAlarms: boolean }> {
    console.log('[BatteryOptimization] Web/iOS platform - returning true (no optimization needed)');
    return { isIgnoring: true, canScheduleExactAlarms: true };
  }

  async requestExactAlarmPermission(): Promise<void> {
    console.log('[BatteryOptimization] Web/iOS platform - no action needed');
    return Promise.resolve();
  }

  async requestIgnoreBatteryOptimizations(): Promise<void> {
    console.log('[BatteryOptimization] Web platform - no action needed');
    return Promise.resolve();
  }
}
