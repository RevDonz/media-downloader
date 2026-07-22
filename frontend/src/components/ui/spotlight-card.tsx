"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Kartu dengan sorotan (spotlight) yang mengikuti kursor.
 * Ringan: tidak ada state React / re-render — hanya menulis CSS variable
 * (--spot-x/--spot-y) lewat requestAnimationFrame, jadi murni kerja compositor.
 */
export function SpotlightCard({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const ref = React.useRef<HTMLDivElement>(null);
  const frame = React.useRef<number | null>(null);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || frame.current != null) return;
    const x = e.clientX;
    const y = e.clientY;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--spot-x", `${x - rect.left}px`);
      el.style.setProperty("--spot-y", `${y - rect.top}px`);
    });
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      className={cn("group/spot relative", className)}
      {...props}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(220px circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in oklch, var(--foreground) 10%, transparent), transparent 60%)",
        }}
      />
      {children}
    </div>
  );
}
