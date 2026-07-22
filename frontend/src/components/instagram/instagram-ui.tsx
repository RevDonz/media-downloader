"use client";

import * as React from "react";
import {
  Loader2,
  BadgeCheck,
  Info,
  TriangleAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { proxyImg, fmtCount } from "@/lib/media";
import { igLoginCheck } from "@/lib/api";
import type { IgProfile, IgTab } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

// ---------------------------------------------------------------------------
// CookieSettingsSheet
// ---------------------------------------------------------------------------
export function CookieSettingsSheet({
  open,
  onOpenChange,
  sessionid,
  onSave,
  onVerified,
  currentUser,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sessionid: string;
  onSave: (v: string) => void;
  onVerified?: (username: string | null) => void;
  currentUser?: string | null;
}) {
  const [value, setValue] = React.useState(sessionid);
  const [checking, setChecking] = React.useState(false);

  React.useEffect(() => {
    if (open) setValue(sessionid);
  }, [open, sessionid]);

  const runCheck = async (sid: string) => {
    if (!sid) {
      toast.error("Isi sessionid dulu.");
      return;
    }
    setChecking(true);
    try {
      const res = await igLoginCheck(sid);
      if (res.ok) {
        onSave(sid); // simpan cookie yang terbukti valid
        onVerified?.(res.username || null);
        toast.success("Login sebagai @" + res.username);
      } else {
        onVerified?.(null);
        toast.error(res.error || "Login gagal.");
      }
    } catch (e) {
      onVerified?.(null);
      toast.error((e as Error).message);
    } finally {
      setChecking(false);
    }
  };

  const handleSave = () => {
    onSave(value.trim());
    runCheck(value.trim()); // simpan + verifikasi (perbarui badge)
  };

  const handleCheck = () => runCheck(value.trim());

  const handleClear = () => {
    setValue("");
    onSave("");
    onVerified?.(null);
    toast.success("Sessionid dihapus.");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Pengaturan Cookie</SheetTitle>
          <SheetDescription>
            Login diperlukan untuk akun privat, Story, dan Highlight.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          <div>
            {currentUser ? (
              <Badge className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-3" />
                Login sebagai @{currentUser}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-muted-foreground">
                Belum login
              </Badge>
            )}
          </div>

          <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Cara ambil sessionid:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>Buka instagram.com dan login di browser.</li>
              <li>
                Tekan <kbd className="rounded bg-background px-1">F12</kbd> untuk
                membuka DevTools.
              </li>
              <li>
                Buka tab <b>Application</b> &rarr; <b>Cookies</b> &rarr;{" "}
                <b>instagram.com</b>.
              </li>
              <li>
                Salin nilai cookie bernama <b>sessionid</b>.
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ig-sessionid">Sessionid</Label>
            <Input
              id="ig-sessionid"
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Tempel sessionid di sini…"
              className="rounded-lg font-mono"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Sessionid hanya disimpan di perangkat kamu (localStorage) dan dikirim
            ke server hanya saat mengambil data. Jangan bagikan ke siapa pun.
          </p>
        </div>

        <SheetFooter className="gap-2">
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              Simpan
            </Button>
            <Button
              variant="outline"
              onClick={handleCheck}
              disabled={checking}
              className="flex-1 gap-2"
            >
              {checking && <Loader2 className="size-4 animate-spin" />}
              Cek Login
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={handleClear}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Hapus
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// ProfileCard
// ---------------------------------------------------------------------------
export function ProfileCard({ profile }: { profile: IgProfile }) {
  return (
    <Card className="flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-start">
      <Avatar className="size-20 shrink-0 ring-2 ring-border sm:size-24">
        <AvatarImage
          src={proxyImg(profile.profile_pic, "avatar.jpg")}
          alt={profile.username}
        />
        <AvatarFallback>
          {(profile.username || "?").slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold">@{profile.username}</span>
          {profile.is_verified && (
            <BadgeCheck className="size-5 text-ig" aria-label="Terverifikasi" />
          )}
          {profile.is_private && (
            <Badge variant="secondary" className="text-muted-foreground">
              Private
            </Badge>
          )}
        </div>

        {profile.full_name && (
          <p className="text-sm font-medium text-muted-foreground">
            {profile.full_name}
          </p>
        )}

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span>
            <b className="tabular-nums">{fmtCount(profile.posts_count)}</b>{" "}
            <span className="text-muted-foreground">posts</span>
          </span>
          <span>
            <b className="tabular-nums">{fmtCount(profile.followers)}</b>{" "}
            <span className="text-muted-foreground">pengikut</span>
          </span>
          <span>
            <b className="tabular-nums">{fmtCount(profile.following)}</b>{" "}
            <span className="text-muted-foreground">diikuti</span>
          </span>
        </div>

        {profile.biography && (
          <p className="line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">
            {profile.biography}
          </p>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// WarningAlerts
// ---------------------------------------------------------------------------
export function WarningAlerts({ warnings }: { warnings: string[] }) {
  if (!warnings || warnings.length === 0) return null;
  return (
    <div className="space-y-2">
      {warnings.map((w, i) => (
        <Alert
          key={i}
          className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        >
          <TriangleAlert className="size-4" />
          <AlertTitle>Perhatian</AlertTitle>
          <AlertDescription className="text-amber-700/90 dark:text-amber-300/90">
            {w}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MediaTabs
// ---------------------------------------------------------------------------
const TABS: { key: IgTab; label: string }[] = [
  { key: "posts", label: "Post" },
  { key: "reels", label: "Reels" },
  { key: "stories", label: "Story" },
  { key: "highlights", label: "Highlight" },
];

export function MediaTabs({
  active,
  onChange,
  counts,
  loadingExtra,
}: {
  active: IgTab;
  onChange: (v: IgTab) => void;
  counts: Record<IgTab, number>;
  loadingExtra: boolean;
}) {
  return (
    <Tabs value={active} onValueChange={(v) => onChange(v as IgTab)}>
      <TabsList className="w-full">
        {TABS.map(({ key, label }) => {
          const isExtra = key === "stories" || key === "highlights";
          return (
            <TabsTrigger
              key={key}
              value={key}
              className={cn(
                "flex-1 gap-1.5",
                active === key && "text-ig-gradient",
              )}
            >
              <span>{label}</span>
              {isExtra && loadingExtra ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {counts[key]}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

// Re-export ikon Info agar konsisten bila dibutuhkan di tempat lain.
export { Info };
