import { PlatformNav } from "@/components/nav/PlatformNav";

export default function DownloaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-r from-fuchsia-600/10 via-violet-600/10 to-cyan-500/10 blur-[120px]"
      />
      <PlatformNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}
