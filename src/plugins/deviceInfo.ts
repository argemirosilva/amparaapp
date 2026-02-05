import { registerPlugin } from '@capacitor/core';

export interface DeviceInfoExtended {
  /**
   * Nome do modelo do dispositivo (ex: "Samsung Galaxy S21")
   */
  deviceModel: string;
  
  /**
   * Nível de bateria (0-100)
   */
  batteryLevel: number;
  
  /**
   * Se o dispositivo está carregando
   */
  isCharging: boolean;
  
  /**
   * Versão do Android (ex: "13")
   */
  androidVersion: string;
  
  /**
   * Versão do app (ex: "1.0.0")
   */
  appVersion: string;
  
  /**
   * Se o app está ignorando otimização de bateria
   */
  isIgnoringBatteryOptimization: boolean;
  
  /**
   * Tipo de conexão (wifi, cellular, none)
   */
  connectionType: string;
  
  /**
   * Força do sinal WiFi (0-100) ou null se não estiver em WiFi
   */
  wifiSignalStrength: number | null;
  
  /**
   * Versão do iOS (ex: "18.7") - apenas iOS
   */
  iosVersion?: string;
  
  /**
   * Timezone do dispositivo (ex: "America/Sao_Paulo")
   */
  timezone?: string;
  
  /**
   * Offset do timezone em minutos (ex: -180 para GMT-3)
   */
  timezoneOffsetMinutes?: number;
}

export interface DeviceInfoPlugin {
  /**
   * Obtém informações estendidas do dispositivo
   */
  getExtendedInfo(): Promise<DeviceInfoExtended>;
}

const DeviceInfoExtendedPlugin = registerPlugin<DeviceInfoPlugin>('DeviceInfoExtended', {
  web: () => import('./deviceInfoWeb').then(m => new m.DeviceInfoWeb()),
});

export default DeviceInfoExtendedPlugin;
