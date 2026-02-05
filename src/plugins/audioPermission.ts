import { registerPlugin } from '@capacitor/core';

export interface AudioPermissionPlugin {
  /**
   * Check if RECORD_AUDIO permission is granted
   */
  checkPermission(): Promise<{ granted: boolean }>;
  
  /**
   * Request RECORD_AUDIO permission
   */
  requestPermission(): Promise<{ granted: boolean }>;
}

const AudioPermission = registerPlugin<AudioPermissionPlugin>('AudioPermission', {
  web: () => import('./audioPermissionWeb').then(m => new m.AudioPermissionWeb()),
});

export default AudioPermission;
