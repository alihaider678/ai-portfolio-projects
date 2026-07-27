"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Ctx = {
  apiKey: string;
  setApiKey: (k: string) => void;
  hasKey: boolean;
  dialogOpen: boolean;
  setDialogOpen: (v: boolean) => void;
};

const ApiKeyContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "tg_openai_key";

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setApiKeyState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setApiKey = (k: string) => {
    setApiKeyState(k);
    try {
      if (k) localStorage.setItem(STORAGE_KEY, k);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <ApiKeyContext.Provider
      value={{ apiKey, setApiKey, hasKey: apiKey.trim().length > 0, dialogOpen, setDialogOpen }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) throw new Error("useApiKey must be used within ApiKeyProvider");
  return ctx;
}