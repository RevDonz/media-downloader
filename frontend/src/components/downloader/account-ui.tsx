"use client";

import * as React from "react";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Header konsisten untuk halaman berbasis akun (Instagram & TikTok).
export function AccountHeader({
  brand,
  brandClassName,
  description,
}: {
  brand: string;
  brandClassName?: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">
        <span className={brandClassName}>{brand}</span> Downloader
      </h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// Search bar konsisten. `trailing` untuk aksi khusus (mis. tombol cookie IG).
export function AccountSearchBar({
  value,
  onChange,
  onSubmit,
  loading,
  placeholder,
  buttonClassName,
  trailing,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  placeholder: string;
  buttonClassName?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex items-center gap-2"
    >
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 flex-1 rounded-lg text-base"
      />
      <Button
        type="submit"
        disabled={loading}
        className={cn(
          "h-11 gap-2 rounded-lg px-5 text-white hover:opacity-90",
          buttonClassName,
        )}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Search className="size-4" />
        )}
        Cari
      </Button>
      {trailing}
    </form>
  );
}
