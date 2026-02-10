import { useEffect, useRef } from 'react';
import { reportMonitoringStatus } from '@/lib/api';

interface UseMonitoringHeartbeatOptions {
  isWithinPeriod: boolean;      // Is currently within monitoring period
  isMonitoring: boolean;         // Is monitoring active
  enabled: boolean;              // Should heartbeat be enabled
  intervalMinutes?: number;      // Heartbeat interval in minutes (default: 5)
}

/**
 * Hook to send periodic monitoring status reports to the server
 * This ensures the server knows the app is still alive and monitoring
 */
export function useMonitoringHeartbeat(options: UseMonitoringHeartbeatOptions) {
  const {
    isWithinPeriod,
    isMonitoring,
    enabled,
    intervalMinutes = 5,
  } = options;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastStatusRef = useRef<boolean | null>(null);

  useEffect(() => {
    // Only run heartbeat if enabled and monitoring is active
    if (!enabled || !isMonitoring) {
      // Clean up timer if exists
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Function to send heartbeat
    const sendHeartbeat = async () => {
      const status = isWithinPeriod ? 'janela_iniciada' : 'janela_finalizada';
      const motivo = isWithinPeriod ? 'janela_agendada' : 'fora_da_janela';

      console.log('[MonitoringHeartbeat] 💓 Sending heartbeat:', {
        status,
        motivo,
        isMonitoring,
        isWithinPeriod,
      });

      try {
        await reportMonitoringStatus(status, isMonitoring, motivo);
        console.log('[MonitoringHeartbeat] ✅ Heartbeat sent successfully');
      } catch (error) {
        console.error('[MonitoringHeartbeat] ❌ Failed to send heartbeat:', error);
      }
    };

    // Send initial heartbeat if status changed or first time
    if (lastStatusRef.current !== isWithinPeriod) {
      const status = isWithinPeriod ? 'janela_iniciada' : 'janela_finalizada';
      // Use correct motivo based on current period status
      const motivo = isWithinPeriod ? 'janela_agendada' : 'fora_da_janela';

      console.log('[MonitoringHeartbeat] 📡 Status changed, sending immediate report:', {
        status,
        motivo,
        previousStatus: lastStatusRef.current,
        currentStatus: isWithinPeriod,
      });

      reportMonitoringStatus(status, isMonitoring, motivo).catch((error) => {
        console.error('[MonitoringHeartbeat] ❌ Failed to send status change:', error);
      });

      lastStatusRef.current = isWithinPeriod;
    }

    // Set up periodic heartbeat
    const intervalMs = intervalMinutes * 60 * 1000;
    intervalRef.current = setInterval(sendHeartbeat, intervalMs);

    console.log(`[MonitoringHeartbeat] 💓 Heartbeat timer started (every ${intervalMinutes} minutes)`);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('[MonitoringHeartbeat] 💓 Heartbeat timer stopped');
      }
    };
  }, [enabled, isMonitoring, isWithinPeriod, intervalMinutes]);

  return {
    // No state to return, just runs in background
  };
}
