"use client";

import { toast } from 'sonner';

export type RealtimeEventType =
  | 'ANNOUNCEMENT_POSTED'
  | 'REGISTRATION_SUBMITTED'
  | 'REGISTRATION_REVIEWED'
  | 'ATTENDANCE_CHECKED_IN'
  | 'ATTENDANCE_MARKED'
  | 'CERTIFICATE_ISSUED'
  | 'ACTIVITY_CREATED';

export interface RealtimeMessage {
  type: RealtimeEventType;
  payload: any;
  senderRole?: string;
  senderName?: string;
  timestamp: string;
}

type Listener = (msg: RealtimeMessage) => void;

class RealtimeSyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<Listener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel('cnhs_realtime_events');
          this.channel.onmessage = (event) => {
            this.notifyListeners(event.data);
          };
        }
      } catch (e) {
        console.warn('[RealtimeSync] BroadcastChannel unavailable, using storage fallback');
      }

      // Storage event fallback for cross-tab communication
      window.addEventListener('storage', (event) => {
        if (event.key === 'cnhs_realtime_event_signal' && event.newValue) {
          try {
            const data = JSON.parse(event.newValue);
            this.notifyListeners(data);
          } catch {}
        }
      });
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(msg: RealtimeMessage) {
    this.listeners.forEach((fn) => {
      try {
        fn(msg);
      } catch (err) {
        console.error('[RealtimeSync listener error]:', err);
      }
    });
  }

  public broadcast(type: RealtimeEventType, payload: any, senderName?: string, senderRole?: string) {
    const message: RealtimeMessage = {
      type,
      payload,
      senderName,
      senderRole,
      timestamp: new Date().toISOString(),
    };

    // Notify local listeners
    this.notifyListeners(message);

    // Broadcast across browser tabs
    try {
      if (this.channel) {
        this.channel.postMessage(message);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('cnhs_realtime_event_signal', JSON.stringify({ ...message, _rnd: Math.random() }));
      }
    } catch (e) {
      console.warn('[RealtimeSync broadcast error]:', e);
    }
  }
}

export const realtimeSync = new RealtimeSyncManager();
