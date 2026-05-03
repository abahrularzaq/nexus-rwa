export interface RiskBadgeProps {
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  showDot?: boolean;
}

const levelClass: Record<
  RiskBadgeProps["level"],
  { wrap: string; dot: string }
> = {
  LOW: {
    wrap:
      "border-[rgba(0,255,136,0.3)] bg-[rgba(0,255,136,0.1)] text-[#00FF88]",
    dot: "bg-[#00FF88]",
  },
  MEDIUM: {
    wrap:
      "border-[rgba(255,184,0,0.3)] bg-[rgba(255,184,0,0.1)] text-[#FFB800]",
    dot: "bg-[#FFB800]",
  },
  HIGH: {
    wrap:
      "border-[rgba(255,68,68,0.3)] bg-[rgba(255,68,68,0.1)] text-[#FF4444]",
    dot: "bg-[#FF4444]",
  },
  CRITICAL: {
    wrap:
      "border-[rgba(255,68,68,0.5)] bg-[rgba(255,68,68,0.2)] text-[#FF4444]",
    dot: "bg-[#FF4444]",
  },
};

export function RiskBadge({ level, showDot = false }: RiskBadgeProps) {
  const { wrap, dot } = levelClass[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wide ${wrap}`}
    >
      {showDot ? (
        <span
          className={`size-1.5 shrink-0 rounded-full ${dot}`}
          aria-hidden
        />
      ) : null}
      {level}
    </span>
  );
}
