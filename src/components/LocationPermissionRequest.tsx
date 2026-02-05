import { useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

/**
 * Componente que solicita permissão de localização automaticamente
 * quando o app inicia (após bypass da tela de permissões)
 */
export function LocationPermissionRequest() {
  useEffect(() => {
    console.log('[LocationPermission] 🚀 Componente montado, aguardando para solicitar permissão...');

    const requestLocationPermission = async () => {
      console.log('[LocationPermission] ⏰ Iniciando solicitação de permissão...');

      if (!Capacitor.isNativePlatform()) {
        console.log('[LocationPermission] Web platform, skipping auto-request');
        return;
      }

      try {
        console.log('[LocationPermission] 🔍 Verificando status atual...');
        // Verificar se já tem permissão
        const status = await Geolocation.checkPermissions();
        console.log('[LocationPermission] 📊 Status atual:', status);

        if (status.location === 'granted') {
          console.log('[LocationPermission] ✅ Já tem permissão de localização');
          return;
        }

        if (status.location === 'denied') {
          console.log('[LocationPermission] ❌ Permissão de localização negada anteriormente');
          console.log('[LocationPermission] 💡 Usuário precisa habilitar manualmente nas Configurações');
          return;
        }

        // Solicitar permissão
        console.log('[LocationPermission] 📍 SOLICITANDO PERMISSÃO DE LOCALIZAÇÃO AGORA...');
        const result = await Geolocation.requestPermissions();
        console.log('[LocationPermission] 📊 Resultado:', result);

        if (result.location === 'granted') {
          console.log('[LocationPermission] ✅ Permissão de localização concedida!');
        } else {
          console.log('[LocationPermission] ❌ Permissão de localização negada pelo usuário');
        }
      } catch (error) {
        console.error('[LocationPermission] ❌ Erro ao solicitar permissão:', error);
      }
    };

    // Aguardar apenas 1 segundo após o app carregar para solicitar
    const timer = setTimeout(requestLocationPermission, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Componente não renderiza nada
  return null;
}
