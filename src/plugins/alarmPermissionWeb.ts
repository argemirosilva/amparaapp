import { WebPlugin } from '@capacitor/core';
import type { AlarmPermissionPlugin } from './alarmPermission';

export class AlarmPermissionWeb extends WebPlugin implements AlarmPermissionPlugin {
  async canScheduleExactAlarms(): Promise<{ canSchedule: boolean }> {
    console.log('[AlarmPermission] Web/iOS platform - returning true (no permission needed)');
    return { canSchedule: true };
  }

  async requestScheduleExactAlarms(): Promise<void> {
    console.log('[AlarmPermission] Web/iOS platform - no action needed');
    return Promise.resolve();
  }
}
