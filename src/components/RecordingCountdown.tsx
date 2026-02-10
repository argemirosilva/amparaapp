import { Clock } from 'lucide-react';

interface RecordingCountdownProps {
  remainingSeconds: number;
  timeoutType: 'absolute' | 'silence' | 'panic' | 'none';
}

export function RecordingCountdown({ remainingSeconds, timeoutType }: RecordingCountdownProps) {
  if (timeoutType !== 'silence' || remainingSeconds <= 0) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins > 0) {
      return `${mins}min ${secs}s`;
    }
    return `${secs}s`;
  };

  const getColor = (): string => {
    if (remainingSeconds <= 30) return 'text-destructive';
    if (remainingSeconds <= 60) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock className={`h-4 w-4 ${getColor()}`} />
      <span className={getColor()}>
        Vai parar por inatividade em <strong>{formatTime(remainingSeconds)}</strong>
      </span>
    </div>
  );
}
