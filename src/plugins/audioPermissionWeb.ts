import { WebPlugin } from '@capacitor/core';
import type { AudioPermissionPlugin } from './audioPermission';

export class AudioPermissionWeb extends WebPlugin implements AudioPermissionPlugin {
  async checkPermission(): Promise<{ granted: boolean }> {
    console.log('[AudioPermission] Web/iOS platform - checking via navigator.mediaDevices');
    
    try {
      // Tentar verificar permissão via Web API
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return { granted: result.state === 'granted' };
    } catch (error) {
      // Se não suportar permissions API, assumir que precisa solicitar
      console.log('[AudioPermission] Permissions API not supported, returning false');
      return { granted: false };
    }
  }

  async requestPermission(): Promise<{ granted: boolean }> {
    console.log('[AudioPermission] Web/iOS platform - requesting via getUserMedia');
    
    try {
      // Solicitar permissão via getUserMedia
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Parar stream imediatamente
      stream.getTracks().forEach(track => track.stop());
      
      console.log('[AudioPermission] Permission granted');
      return { granted: true };
    } catch (error) {
      console.error('[AudioPermission] Permission denied:', error);
      return { granted: false };
    }
  }
}
