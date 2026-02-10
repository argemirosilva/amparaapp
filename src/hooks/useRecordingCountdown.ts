import { useState, useEffect } from 'react';
import { AudioTriggerNative } from '@/plugins/audioTriggerNative';

interface RecordingCountdown {
  remainingSeconds: number;
  timeoutType: 'absolute' | 'silence' | 'panic' | 'none';
  isRecording: boolean;
}

export function useRecordingCountdown() {
  const [countdown, setCountdown] = useState<RecordingCountdown>({
    remainingSeconds: 0,
    timeoutType: 'none',
    isRecording: false,
  });

  useEffect(() => {
    const handleCountdown = (data: any) => {
      setCountdown({
        remainingSeconds: data.remainingSeconds || 0,
        timeoutType: data.timeoutType || 'none',
        isRecording: data.isRecording || false,
      });
    };

    // Listen to native countdown events (dedicated channel)
    const countdownListener = AudioTriggerNative.addListener('recordingCountdown', handleCountdown);
    // Backward compatibility: older native builds may emit through audioTriggerEvent
    const legacyListener = AudioTriggerNative.addListener('audioTriggerEvent', (data: any) => {
      if (data?.event === 'recordingCountdown') {
        handleCountdown(data);
      }
    });

    return () => {
      countdownListener.then(l => l.remove());
      legacyListener.then(l => l.remove());
    };
  }, []);

  return countdown;
}
