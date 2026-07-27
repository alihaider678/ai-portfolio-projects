"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  meta?: React.ReactNode;
}

export default function Select({
  value, onChange, options, placeholder, mono,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  mono?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className={`field w-full px-3.5 py-2.5 rounded-xl text-sm flex items-center justify-between gap-2 text-left ${mono ? "font-mono" : ""}`}>
        <span className="truncate">{selected ? selected.label : placeholder ?? "Select…"}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-[var(--text-faint)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.15 }}
            className="absolute z-30 mt-1.5 w-full max-h-72 overflow-y-auto rounded-xl border card-solid glow p-1.5">
            {options.map((o) => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-[var(--surface-2)] ${mono ? "font-mono" : ""}`}
                style={{ color: o.value === value ? "var(--text-strong)" : "var(--text-muted)" }}>
                <span className="truncate flex items-center gap-2 min-w-0">
                  <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                    {o.value === value && <Check className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />}
                  </span>
                  <span className="truncate">{o.label}</span>
                </span>
                {o.meta && <span className="shrink-0">{o.meta}</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}