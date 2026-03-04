import { registerPlugin } from '@capacitor/core';

export interface SessionExpiredListenerPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
  addListener(eventName: string, listenerFunc: (data: any) => void): Promise<any>;
}

const SessionExpiredListener = registerPlugin<SessionExpiredListenerPlugin>('SessionExpiredListener');

export default SessionExpiredListener;
