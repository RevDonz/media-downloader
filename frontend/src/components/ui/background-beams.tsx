"use client";

import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

// Komponen resmi Aceternity UI — Background Beams.
// Sumber: https://ui.aceternity.com/components/background-beams
// Path dibangun dari rumus asli Aceternity (tiap garis geser +7x / -8y).
export const BackgroundBeams = React.memo(function BackgroundBeams({
  className,
}: {
  className?: string;
}) {
  const paths = Array.from({ length: 51 }, (_, i) => {
    const dx = 7 * i;
    const dy = 8 * i;
    return (
      `M${-380 + dx} ${-189 - dy}C${-380 + dx} ${-189 - dy} ${-312 + dx} ${216 - dy} ${152 + dx} ${343 - dy}` +
      `C${616 + dx} ${470 - dy} ${684 + dx} ${875 - dy} ${684 + dx} ${875 - dy}`
    );
  });

  return (
    <div
      className={cn(
        "absolute inset-0 flex h-full w-full items-center justify-center",
        className,
      )}
    >
      <svg
        className="pointer-events-none absolute z-0 h-full w-full"
        width="100%"
        height="100%"
        viewBox="0 0 696 316"
        fill="none"
      >
        <path
          d="M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875"
          stroke="url(#paint0_radial_beams)"
          strokeOpacity="0.05"
          strokeWidth="0.5"
        />
        {paths.map((path, index) => (
          <motion.path
            key={`path-${index}`}
            d={path}
            stroke={`url(#linearGradient-${index})`}
            strokeOpacity="0.4"
            strokeWidth="0.5"
          />
        ))}
        <defs>
          {paths.map((path, index) => (
            <motion.linearGradient
              id={`linearGradient-${index}`}
              key={`gradient-${index}`}
              initial={{ x1: "0%", x2: "0%", y1: "0%", y2: "0%" }}
              animate={{
                x1: ["0%", "100%"],
                x2: ["0%", "95%"],
                y1: ["0%", "100%"],
                y2: ["0%", `${93 + Math.random() * 8}%`],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                ease: "easeInOut",
                repeat: Infinity,
                delay: Math.random() * 10,
              }}
            >
              <stop stopColor="#18CCFC" stopOpacity="0" />
              <stop stopColor="#18CCFC" />
              <stop offset="0.325" stopColor="#6344F5" />
              <stop offset="1" stopColor="#AE48FF" stopOpacity="0" />
            </motion.linearGradient>
          ))}
          <radialGradient
            id="paint0_radial_beams"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(352 34) rotate(90) scale(555 1560)"
          >
            <stop offset="0.0666667" stopColor="var(--muted-foreground)" />
            <stop offset="0.243243" stopColor="var(--muted-foreground)" />
            <stop offset="0.43594" stopColor="var(--muted-foreground)" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
});
