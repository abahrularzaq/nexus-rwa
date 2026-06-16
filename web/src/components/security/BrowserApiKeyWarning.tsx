type BrowserApiKeyWarningProps = {
  className?: string;
};

export function BrowserApiKeyWarning({ className = "" }: BrowserApiKeyWarningProps) {
  return (
    <div
      className={`rounded-xl border border-[rgba(255,184,0,0.35)] bg-[rgba(255,184,0,0.08)] p-4 text-sm leading-relaxed text-[#FFD36A] ${className}`}
      role="alert"
    >
      <p className="font-semibold text-[#FFE4A3]">Browser API key warning</p>
      <p className="mt-1 text-[#C5CDD8]">
        Developer API keys pasted into the dashboard are stored in this browser only for internal/dev testing.
        Do not paste production user secrets into localStorage. Production user access should use a short-lived
        session or an httpOnly cookie, with sensitive calls routed through the Next.js server proxy.
      </p>
    </div>
  );
}
