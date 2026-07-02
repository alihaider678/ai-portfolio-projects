"use client";

import React, { createContext, useContext, useState } from "react";
import type { ApiKeys } from "@/lib/api";

interface ApiKeysContextValue {
  keys: ApiKeys;
  setKeys: (keys: ApiKeys) => void;
  hasOpenAIKey: boolean;
}

const ApiKeysContext = createContext<ApiKeysContextValue | null>(null);

export function ApiKeysProvider({ children }: { children: React.ReactNode }) {
  const [keys, setKeys] = useState<ApiKeys>({
    openai_api_key: "",
    elevenlabs_api_key: "",
    tts_provider: "openai",
    voice_id: "",
  });

  return (
    <ApiKeysContext.Provider value={{ keys, setKeys, hasOpenAIKey: !!keys.openai_api_key }}>
      {children}
    </ApiKeysContext.Provider>
  );
}

export function useApiKeys() {
  const ctx = useContext(ApiKeysContext);
  if (!ctx) throw new Error("useApiKeys must be used inside ApiKeysProvider");
  return ctx;
}