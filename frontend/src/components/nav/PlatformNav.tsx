"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Play, Camera, Music2, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/youtube", label: "YouTube", Icon: Play, icon: "text-yt", label_: "text-yt" },
  { href: "/instagram", label: "Instagram", Icon: Camera, icon: "text-ig", label_: "text-ig-gradient" },
  { href: "/tiktok", label: "TikTok", Icon: Music2, icon: "text-tt", label_: "text-tt-gradient" },
] as const;

export function PlatformNav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-foreground text-background">
            <Download className="size-4" />
          </span>
          <span className="hidden sm:inline">
            Media<span className="text-muted-foreground">Downloader</span>
          </span>
        </Link>

        <nav className="flex items-center gap-0.5">
          {NAV.map(({ href, label, Icon, icon, label_ }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-muted",
                )}
              >
                <Icon className={cn("size-4", active && icon)} />
                <span className={cn("hidden sm:inline", active && label_)}>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
