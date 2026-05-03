"use client";

import { useEffect, useState } from "react";

interface CountUpProps {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function CountUpClient({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}: CountUpProps) {
  const [value, setValue] = useState(to);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Animasi count up
    const duration = 1500;
    const steps = 60;
    const increment = to / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, to);
      setValue(current);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [to]);

  // Saat belum mounted, render nilai akhir langsung
  // tanpa animasi untuk menghindari hydration mismatch
  const displayValue = mounted ? value : to;

  return (
    <span className={`tabular ${className}`}>
      {prefix}
      {displayValue.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
