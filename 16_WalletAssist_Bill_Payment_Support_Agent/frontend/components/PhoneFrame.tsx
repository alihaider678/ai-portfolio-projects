"use client";

export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="phone-frame mx-auto">
      <div className="phone-notch" />
      <div className="flex flex-col h-[600px] pt-[22px]" style={{ background: "var(--bg)" }}>
        {children}
      </div>
    </div>
  );
}