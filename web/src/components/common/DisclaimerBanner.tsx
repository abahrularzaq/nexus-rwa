import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { DISCLAIMERS, type DisclaimerDefinition, type DisclaimerVariant } from "@/lib/disclaimers";

type DisclaimerBannerProps = {
  variant?: DisclaimerVariant;
  disclaimer?: DisclaimerDefinition;
  compact?: boolean;
  className?: string;
};

const toneStyles = {
  neutral: {
    icon: Info,
    color: "var(--accent-cyan)",
    background: "rgba(0,212,255,0.08)",
    border: "rgba(0,212,255,0.24)",
  },
  warning: {
    icon: AlertTriangle,
    color: "#FFB800",
    background: "rgba(255,184,0,0.08)",
    border: "rgba(255,184,0,0.24)",
  },
  success: {
    icon: CheckCircle2,
    color: "var(--accent-green)",
    background: "rgba(0,255,136,0.08)",
    border: "rgba(0,255,136,0.24)",
  },
} as const;

export function DisclaimerBanner({
  variant = "global",
  disclaimer,
  compact = false,
  className = "",
}: DisclaimerBannerProps) {
  const content = disclaimer ?? DISCLAIMERS[variant];
  const tone = toneStyles[content.tone];
  const Icon = tone.icon;

  return (
    <aside
      className={`rounded-2xl ${compact ? "p-4" : "p-5"} ${className}`}
      style={{
        background: tone.background,
        border: `1px solid ${tone.border}`,
      }}
      aria-label={content.title}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.06)", color: tone.color }}
        >
          <Icon size={17} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className={`${compact ? "text-sm" : "text-base"} font-bold text-white`}>{content.title}</h3>
          <p className={`${compact ? "mt-1 text-xs" : "mt-2 text-sm"} leading-relaxed`} style={{ color: "var(--text-secondary)" }}>
            {content.body}
          </p>
          {!compact && content.bullets?.length ? (
            <ul className="mt-3 space-y-1.5 text-xs leading-relaxed" style={{ color: "#CBD5E1" }}>
              {content.bullets.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true" style={{ color: tone.color }}>
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
