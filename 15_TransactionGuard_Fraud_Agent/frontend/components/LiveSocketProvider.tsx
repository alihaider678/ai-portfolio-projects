"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface InvestigationEvent {
  type: "investigation_complete" | "investigation_error";
  investigation_id: string;
  transaction_id?: string;
  account_id?: string;
  risk_level?: string;
  action?: string;
  explanation?: string;
  error?: string;
}

type Ctx = { lastEvent: InvestigationEvent | null; connected: boolean };
const LiveSocketContext = createContext<Ctx>({ lastEvent: null, connected: false });

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8020/ws/investigations";

export function LiveSocketProvider({ children }: { children: React.ReactNode }) {
  const [lastEvent, setLastEvent] = useState<InvestigationEvent | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let closedByUs = false;

    function connect() {
      ws = new WebSocket(WS_URL);
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        if (!closedByUs) retryTimer = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws?.close();
      ws.onmessage = (e) => {
        try {
          setLastEvent(JSON.parse(e.data));
        } catch {
          /* ignore malformed frame */
        }
      };
    }
    connect();

    return () => {
      closedByUs = true;
      if (retryTimer) clearTimeout(retryTimer);
      ws?.close();
    };
  }, []);

  return <LiveSocketContext.Provider value={{ lastEvent, connected }}>{children}</LiveSocketContext.Provider>;
}

export function useLiveSocket() {
  return useContext(LiveSocketContext);
}