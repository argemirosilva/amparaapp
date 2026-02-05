import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Mic, MapPin, Shield, Battery, Bell, BellRing, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestMicrophonePermission, requestLocationPermission } from '@/services/permissionsService';
import { Geolocation } from '@capacitor/geolocation';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import BatteryOptimization from '@/plugins/batteryOptimization';
import AlarmPermission from '@/plugins/alarmPermission';
import { LocalNotifications } from '@capacitor/local-notifications';
import amparaLogo from '@/assets/ampara-logo.png';

interface PermissionItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: 'granted' | 'denied' | 'prompt' | 'checking';
}

const PermissionItem: React.FC<PermissionItemProps> = ({
  icon,
  title,
  description,
  status
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'granted':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'denied':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'checking':
        return <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
      <div className="p-1.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="font-medium text-foreground">{title}</h3>
          {getStatusIcon()}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

interface UnifiedPermissionsScreenProps {
  onComplete: () => void;
}

export const UnifiedPermissionsScreen: React.FC<UnifiedPermissionsScreenProps> = ({ onComplete }) => {
  const [microphoneStatus, setMicrophoneStatus] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [locationStatus, setLocationStatus] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [batteryStatus, setBatteryStatus] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [alarmStatus, setAlarmStatus] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [notificationStatus, setNotificationStatus] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  
  const [requestingMic, setRequestingMic] = useState(false);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [requestingBattery, setRequestingBattery] = useState(false);
  const [requestingAlarm, setRequestingAlarm] = useState(false);
  const [requestingNotification, setRequestingNotification] = useState(false);
  const [isRequestingAll, setIsRequestingAll] = useState(false);

  useEffect(() => {
    checkAllPermissions();
  }, []);

  const checkAllPermissions = async () => {
    const isIOS = Capacitor.getPlatform() === 'ios';
    
    // Check microphone
    try {
      if (isIOS) {
        // iOS: usar Web API diretamente
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setMicrophoneStatus(result.state === 'granted' ? 'granted' : 'prompt');
        } catch {
          setMicrophoneStatus('prompt');
        }
      } else {
        const micStatus = await VoiceRecorder.hasAudioRecordingPermission();
        setMicrophoneStatus(micStatus.value ? 'granted' : 'prompt');
      }
    } catch (error) {
      console.error('Error checking microphone:', error);
      setMicrophoneStatus('prompt');
    }
    
    // Check location
    try {
      const locStatus = await Geolocation.checkPermissions();
      setLocationStatus(locStatus.location === 'granted' ? 'granted' : locStatus.location === 'denied' ? 'denied' : 'prompt');
    } catch (error) {
      console.error('Error checking location:', error);
      setLocationStatus('prompt');
    }
    
    // Check battery optimization
    try {
      if (isIOS) {
        // iOS não precisa de battery optimization
        setBatteryStatus('granted');
      } else {
        const batteryResult = await BatteryOptimization.isIgnoringBatteryOptimizations();
        setBatteryStatus(batteryResult.isIgnoring ? 'granted' : 'prompt');
      }
    } catch (error) {
      console.error('Error checking battery optimization:', error);
      setBatteryStatus(isIOS ? 'granted' : 'prompt');
    }
    
    // Check alarm permission
    try {
      if (isIOS) {
        // iOS não precisa de alarm permission
        setAlarmStatus('granted');
      } else {
        const alarmResult = await AlarmPermission.canScheduleExactAlarms();
        setAlarmStatus(alarmResult.canSchedule ? 'granted' : 'prompt');
      }
    } catch (error) {
      console.error('Error checking alarm permission:', error);
      setAlarmStatus(isIOS ? 'granted' : 'prompt');
    }
    
    // Check notification permission
    try {
      const notifResult = await LocalNotifications.checkPermissions();
      setNotificationStatus(notifResult.display === 'granted' ? 'granted' : notifResult.display === 'denied' ? 'denied' : 'prompt');
    } catch (error) {
      console.error('Error checking notification permission:', error);
      setNotificationStatus('prompt');
    }
  };

  const handleRequestMicrophone = async () => {
    console.log('[UnifiedPermissionsScreen] 🎤 handleRequestMicrophone called');
    setRequestingMic(true);
    const isIOS = Capacitor.getPlatform() === 'ios';
    console.log('[UnifiedPermissionsScreen] Platform:', isIOS ? 'iOS' : 'Android');
    
    try {
      if (isIOS) {
        console.log('[UnifiedPermissionsScreen] iOS: Requesting microphone via getUserMedia...');
        // iOS: solicitar via getUserMedia
        try {
          console.log('[UnifiedPermissionsScreen] Calling navigator.mediaDevices.getUserMedia...');
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('[UnifiedPermissionsScreen] ✅ getUserMedia SUCCESS! Stream:', stream);
          stream.getTracks().forEach(track => {
            console.log('[UnifiedPermissionsScreen] Stopping track:', track.label);
            track.stop();
          });
          console.log('[UnifiedPermissionsScreen] Setting microphone status to GRANTED');
          setMicrophoneStatus('granted');
        } catch (error) {
          console.error('[UnifiedPermissionsScreen] ❌ Microphone permission DENIED:', error);
          setMicrophoneStatus('denied');
        }
      } else {
        console.log('[UnifiedPermissionsScreen] Android: Requesting via plugin...');
        const result = await requestMicrophonePermission();
        console.log('[UnifiedPermissionsScreen] Android result:', result);
        setMicrophoneStatus(result);
      }
    } finally {
      console.log('[UnifiedPermissionsScreen] handleRequestMicrophone finished');
      setRequestingMic(false);
    }
  };

  const handleRequestLocation = async () => {
    setRequestingLocation(true);
    try {
      const result = await requestLocationPermission();
      setLocationStatus(result);
    } finally {
      setRequestingLocation(false);
    }
  };



  const handleRequestBattery = async () => {
    setRequestingBattery(true);
    const isIOS = Capacitor.getPlatform() === 'ios';
    
    try {
      if (isIOS) {
        // iOS não precisa
        setBatteryStatus('granted');
      } else {
        await BatteryOptimization.requestIgnoreBatteryOptimizations();
        const batteryResult = await BatteryOptimization.isIgnoringBatteryOptimizations();
        setBatteryStatus(batteryResult.isIgnoring ? 'granted' : 'denied');
      }
    } catch (error) {
      console.error('Error requesting battery optimization:', error);
      setBatteryStatus(isIOS ? 'granted' : 'denied');
    } finally {
      setRequestingBattery(false);
    }
  };
  
  const handleRequestAlarm = async () => {
    setRequestingAlarm(true);
    const isIOS = Capacitor.getPlatform() === 'ios';
    
    try {
      if (isIOS) {
        // iOS não precisa
        setAlarmStatus('granted');
      } else {
        await AlarmPermission.requestScheduleExactAlarms();
        setTimeout(async () => {
          const alarmResult = await AlarmPermission.canScheduleExactAlarms();
          setAlarmStatus(alarmResult.canSchedule ? 'granted' : 'denied');
        }, 500);
      }
    } catch (error) {
      console.error('Error requesting alarm permission:', error);
      setAlarmStatus(isIOS ? 'granted' : 'denied');
    } finally {
      setRequestingAlarm(false);
    }
  };
  
  const handleRequestNotification = async () => {
    setRequestingNotification(true);
    try {
      const result = await LocalNotifications.requestPermissions();
      setNotificationStatus(result.display === 'granted' ? 'granted' : 'denied');
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setNotificationStatus('denied');
    } finally {
      setRequestingNotification(false);
    }
  };
  
  const handleRequestAll = async () => {
    setIsRequestingAll(true);
    
    // Request all permissions sequentially
    await handleRequestMicrophone();
    await handleRequestLocation();
    await handleRequestBattery();
    await handleRequestAlarm();
    await handleRequestNotification();
    
    setIsRequestingAll(false);
    
    // Check all permissions again
    await checkAllPermissions();
  };

  const allGranted = 
    microphoneStatus === 'granted' &&
    locationStatus === 'granted' &&
    batteryStatus === 'granted' &&
    alarmStatus === 'granted' &&
    notificationStatus === 'granted';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-4">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2">
          <img 
            src={amparaLogo} 
            alt="AMPARA" 
            className="h-12 w-auto"
          />
        </div>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Shield className="w-6 h-6" />
            <h1 className="text-lg font-semibold">Configuração Inicial</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Para sua proteção, o AMPARA precisa das seguintes permissões:
          </p>
        </div>

        {/* Permission Items */}
        <div className="space-y-2">


          <PermissionItem
            icon={<Mic className="w-5 h-5" />}
            title="Microfone"
            description="Detectar situações de risco através do áudio ambiente"
            status={microphoneStatus}
          />
          
          <PermissionItem
            icon={<MapPin className="w-5 h-5" />}
            title="Localização Precisa"
            description="Enviar sua posição exata em caso de emergência"
            status={locationStatus}
          />

          <PermissionItem
            icon={<Battery className="w-5 h-5" />}
            title="Sem Restrições de Bateria"
            description="Configurar como 'Sem Restrições' para funcionar em segundo plano"
            status={batteryStatus}
          />
          
          <PermissionItem
            icon={<Bell className="w-5 h-5" />}
            title="Alarmes e Lembretes"
            description="Permitir que o app defina alarmes e programe ações com hora marcada"
            status={alarmStatus}
          />
          
          <PermissionItem
            icon={<BellRing className="w-5 h-5" />}
            title="Notificações"
            description="Receber alertas e atualizações do sistema de proteção"
            status={notificationStatus}
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {!allGranted && (
            <Button
              onClick={handleRequestAll}
              disabled={isRequestingAll}
              className="w-full"
              size="lg"
            >
              {isRequestingAll ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Solicitando Permissões...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Liberar Todas as Permissões
                </>
              )}
            </Button>
          )}
          
          {allGranted && (
            <Button
              onClick={onComplete}
              className="w-full"
              size="lg"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Continuar
            </Button>
          )}
        </div>

        {/* Info Text */}
        <p className="text-xs text-center text-muted-foreground">
          Suas informações são usadas apenas para sua segurança e nunca são compartilhadas sem sua autorização.
        </p>
      </div>
    </div>
  );
};
