"use client";

import type { ReactNode } from "react";
import { FieldInfo } from "@/components/common/FieldInfo";
import type { FieldKey } from "@/lib/field-definitions";

type MetricFieldValue = string | number | boolean | null | undefined | string[] | number[];

type MetricFieldProps = {
  fieldKey: FieldKey;
  value: MetricFieldValue;
  label?: string;
  helperText?: string;
  emptyValue?: string;
  valueSuffix?: string;
  valuePrefix?: string;
  glossarySlug?: string;
  orientation?: "vertical" | "horizontal";
  variant?: "default" | "card" | "compact";
  className?: string;
};

export function MetricField({
  fieldKey,
  value,
  label,
  helperText,
  emptyValue = "Not available",
  valueSuffix = "",
  valuePrefix = "",
  glossarySlug,
  orientation = "vertical",
  variant = "default",
  className = "",
}: MetricFieldProps) {
  const isHorizontal = orientation === "horizontal";
  const isCard = variant === "card";
  const isCompact = variant === "compact";

  return (
    <div
      className={`min-w-0 ${isHorizontal ? "flex items-start justify-between gap-4" : "space-y-1.5"} ${
        isCard ? "rounded-xl p-4" : ""
      } ${isCompact ? "space-y-1" : ""} ${className}`}
      style={
        isCard
          ? {
              background: "rgba(10,14,26,0.58)",
              border: "1px solid var(--border-line)",
            }
          : undefined
      }
    >
      <div className="min-w-0">
        <div className="text-[11px] label-eyebrow" style={{ color: "var(--text-secondary)" }}>
          <FieldInfo fieldKey={fieldKey} label={label} glossarySlug={glossarySlug} />
        </div>
        {helperText ? (
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {helperText}
          </p>
        ) : null}
      </div>
      <div
        className={`${isHorizontal ? "text-right" : ""} ${isCompact ? "text-sm" : "text-base"} font-bold break-words`}
        style={{ color: isEmptyValue(value) ? "var(--text-muted)" : "#fff" }}
      >
        {formatMetricValue(value, { emptyValue, valuePrefix, valueSuffix })}
      </div>
    </div>
  );
}

type MetricGridProps = {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
};

export function MetricGrid({ children, columns = 3, className = "" }: MetricGridProps) {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  }[columns];

  return <div className={`grid ${gridClass} gap-3 ${className}`}>{children}</div>;
}

type MetricSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function MetricSection({ title, description, children, className = "" }: MetricSectionProps) {
  return (
    <section
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: "rgba(15,22,41,0.62)",
        border: "1px solid var(--border-line)",
      }}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function isEmptyValue(value: MetricFieldValue) {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

function formatMetricValue(
  value: MetricFieldValue,
  options: { emptyValue: string; valuePrefix: string; valueSuffix: string },
) {
  if (isEmptyValue(value)) return options.emptyValue;

  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) return value.join(", ");

  return `${options.valuePrefix}${value}${options.valueSuffix}`;
}
