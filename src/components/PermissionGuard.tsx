import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import BatteryOptimization from '../plugins/batteryOptimization';
import KeepAlive from '../plugins/keepAlive';
import { getDeviceId } from '../lib/deviceId';
import { UnifiedPermissionsScreen } from './UnifiedPermissionsScreen';
import { checkPermissions } from '@/services/permissionsService';
import { PermissionFlowState } from '@/services/permissionFlowState';

interface PermissionGuardProps {
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ children }) => {
  console.log('🚨🚨🚨 [PermissionGuard] COMPONENT MOUNTED! 🚨🚨🚨');
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);

  // Initialize PermissionFlowState
  useEffect(() => {
    PermissionFlowState.init();
  }, []);

  const checkAndRequestPermissions = async () => {
    try {
      console.log('[PermissionGuard] 🔍 BYPASS: Pulando verificação de permissões...');

      // BYPASS: Sempre considerar que as permissões estão OK
      // As permissões serão solicitadas individualmente quando necessário
      console.log('[PermissionGuard] ✅ BYPASS: Marcando todas as permissões como concedidas');

      // Update PermissionFlowState - marcar que não há permissões faltando
      PermissionFlowState.setMissing({
        audio: false,
        location: false,
      });

      // SEMPRE pular a tela de permissões
      console.log('[PermissionGuard] ✅ BYPASS: Liberando acesso ao app');
      console.log('[PermissionGuard] Releasing app to show login/home screen');

      setHasPermissions(true);
      // Permission flow ended (bypass ativado)
      PermissionFlowState.setInFlow(false, 'bypass permissions screen');

      // Note: KeepAlive service will be started by App.tsx after authentication
    } catch (error) {
      console.error('[PermissionGuard] Error in bypass:', error);
      // Mesmo com erro, liberar o acesso
      setHasPermissions(true);
    }

    // Note: KeepAlive service is now started in App.tsx after successful login
  };

  useEffect(() => {
    checkAndRequestPermissions();
  }, []);

  if (hasPermissions === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (hasPermissions === false) {
    return <UnifiedPermissionsScreen onComplete={checkAndRequestPermissions} />;
  }

  return <>{children}</>;
};
