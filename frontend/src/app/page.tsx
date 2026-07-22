import Link from "next/link";
import {
  Download,
  Camera,
  Music2,
  ArrowRight,
  PlayCircle,
  Sparkles,
  Infinity as InfinityIcon,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const container = "container mx-auto max-w-6xl px-4 sm:px-6";

type PlatformKey = "download" | "instagram" | "tiktok";

const platforms: {
  key: PlatformKey;
  href: string;
  label: string;
  desc: string;
  Icon: typeof Download;
  iconBox: string;
  glow: string;
  chips: string[];
  primary?: boolean;
}[] = [
  {
    key: "download",
    href: "/download",
    label: "Downloader Umum",
    desc: "Tempel link apa saja — YouTube, X, Facebook, Vimeo, ratusan situs.",
    Icon: Download,
    iconBox: "bg-foreground text-background",
    glow: "bg-primary",
    chips: ["1080p", "MP3", "Seek", "Ratusan situs"],
    primary: true,
  },
  {
    key: "instagram",
    href: "/instagram",
    label: "Instagram",
    desc: "Post, Reels, Story, dan Highlights — publik maupun via cookie.",
    Icon: Camera,
    iconBox: "bg-ig-gradient text-white",
    glow: "bg-ig",
    chips: ["Post", "Reels", "Story", "Login cookie"],
  },
  {
    key: "tiktok",
    href: "/tiktok",
    label: "TikTok",
    desc: "Unduh tanpa watermark, jelajah grid, dan buka profil kreator.",
    Icon: Music2,
    iconBox: "bg-tt-gradient text-white",
    glow: "bg-tt",
    chips: ["No watermark", "Grid", "Profil"],
  },
];

const features: { Icon: typeof PlayCircle; title: string; text: string }[] = [
  {
    Icon: PlayCircle,
    title: "Putar sebelum unduh",
    text: "Pratinjau video langsung di browser supaya kamu yakin sebelum menyimpan.",
  },
  {
    Icon: Sparkles,
    title: "Pilihan kualitas & MP3",
    text: "Pilih resolusi terbaik atau ekstrak audio ke MP3 hanya dengan satu klik.",
  },
  {
    Icon: InfinityIcon,
    title: "Infinite scroll cepat",
    text: "Muat ratusan konten profil secara mulus tanpa ganti-ganti halaman.",
  },
  {
    Icon: KeyRound,
    title: "Login via cookie (opsional)",
    text: "Tempel sessionid untuk membuka Story dan konten privat yang kamu ikuti.",
  },
  {
    Icon: ShieldCheck,
    title: "Privasi diutamakan",
    text: "Tanpa akun, tanpa penyimpanan link. Semua diproses lalu dilupakan.",
  },
];

const steps: { title: string; text: string }[] = [
  {
    title: "Tempel link / cari username",
    text: "Salin URL video atau ketik username, tempel ke kolom pencarian.",
  },
  {
    title: "Pratinjau & pilih",
    text: "Lihat hasil, putar pratinjau, dan tentukan kualitas atau format.",
  },
  {
    title: "Unduh",
    text: "Klik unduh — server menyiapkan file, lalu langsung tersimpan.",
  },
];

function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Download className="size-4" />
      </span>
      <span className="text-base font-semibold tracking-tight">
        MediaDownloader
      </span>
    </Link>
  );
}

function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div
        className={cn(container, "flex h-16 items-center justify-between gap-4")}
      >
        <Logo />
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Button
            className="hidden bg-foreground text-background hover:bg-foreground/90 sm:inline-flex"
            render={<Link href="/download" />}
          >
            <Download className="size-4" /> Downloader
          </Button>
          <Button
            className="hidden bg-ig-gradient text-white hover:opacity-90 sm:inline-flex"
            render={<Link href="/instagram" />}
          >
            <Camera className="size-4" /> Instagram
          </Button>
          <Button
            className="bg-tt-gradient text-white hover:opacity-90"
            render={<Link href="/tiktok" />}
          >
            <Music2 className="size-4" /> TikTok
          </Button>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[900px] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-fuchsia-600/20 via-violet-600/20 to-cyan-500/20 blur-[120px]"
      />
      <div className={cn(container, "flex flex-col items-center text-center")}>
        <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
          Gratis • Tanpa watermark
        </div>

        <h1 className="animate-fade-up mt-6 max-w-3xl text-5xl font-bold tracking-tight sm:text-7xl">
          Unduh video dari <span className="text-ig-gradient">mana saja</span>
        </h1>

        <p className="animate-fade-up mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          Downloader umum untuk ratusan situs, plus Instagram dan TikTok per
          akun. Cepat, bersih, dan tanpa ribet.
        </p>

        <form
          action="/download"
          method="get"
          className="animate-fade-up mt-8 flex w-full max-w-xl flex-col gap-3 sm:flex-row"
        >
          <Input
            name="url"
            type="text"
            placeholder="Tempel link video apa saja…"
            className="h-12 flex-1 rounded-lg text-base"
          />
          <Button
            type="submit"
            size="lg"
            className="h-12 rounded-lg bg-foreground px-6 text-base text-background hover:bg-foreground/90"
          >
            <Download className="size-4" /> Unduh
          </Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Atau pilih platform di bawah
        </p>
      </div>
    </section>
  );
}

function PlatformCards() {
  return (
    <section className="py-20 sm:py-28">
      <div className={container}>
        <div className="grid gap-5 md:grid-cols-3">
          {platforms.map(
            ({ key, href, label, desc, Icon, iconBox, glow, chips, primary }) => (
              <Link key={key} href={href} className="group relative block">
                <div
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute -inset-2 -z-10 rounded-[2rem] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-30",
                    glow,
                  )}
                />
                <Card className="relative flex h-full flex-col overflow-hidden rounded-2xl transition duration-300 group-hover:-translate-y-1 group-hover:border-foreground/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "grid size-12 place-items-center rounded-2xl",
                          iconBox,
                        )}
                      >
                        <Icon className="size-6" />
                      </span>
                      {primary && <Badge>Utama</Badge>}
                    </div>
                    <CardTitle className="mt-4 text-xl">{label}</CardTitle>
                    <CardDescription>{desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {chips.map((c) => (
                        <Badge
                          key={c}
                          variant="secondary"
                          className="rounded-md"
                        >
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="mt-auto text-sm font-medium text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 transition-colors group-hover:text-foreground">
                      Buka
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section id="fitur" className="scroll-mt-20 py-20 sm:py-28">
      <div className={container}>
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Semua yang kamu butuhkan
          </h2>
          <p className="mt-3 text-muted-foreground">
            Dirancang untuk cepat dan enak dipakai, dari pratinjau sampai unduh.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {features.map(({ Icon, title, text }, i) => (
            <div
              key={title}
              className={cn(
                "rounded-2xl border border-border bg-card p-6 transition hover:border-foreground/20",
                i === 0 && "md:col-span-2",
                i === 3 && "md:col-span-2",
              )}
            >
              <span className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="py-20 sm:py-28">
      <div className={container}>
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Cara kerjanya
          </h2>
          <p className="mt-3 text-muted-foreground">Tiga langkah, selesai.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative rounded-2xl border border-border bg-card p-6"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-lg font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="py-20 sm:py-28">
      <div className={container}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-600 via-violet-600 to-cyan-500 p-8 text-center sm:p-14">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Siap mengunduh?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/80">
            Pilih platform favoritmu dan mulai sekarang juga.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="h-11 bg-white text-neutral-900 hover:bg-white/90"
              render={<Link href="/download" />}
            >
              <Download className="size-4" /> Downloader
            </Button>
            <Button
              size="lg"
              className="h-11 bg-white text-neutral-900 hover:bg-white/90"
              render={<Link href="/instagram" />}
            >
              <Camera className="size-4" /> Instagram
            </Button>
            <Button
              size="lg"
              className="h-11 bg-white text-neutral-900 hover:bg-white/90"
              render={<Link href="/tiktok" />}
            >
              <Music2 className="size-4" /> TikTok
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border py-12">
      <div
        className={cn(
          container,
          "flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between",
        )}
      >
        <div className="max-w-sm space-y-3">
          <Logo />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Hanya untuk konten yang kamu miliki haknya. Hormati hak cipta & ToS
            platform.
          </p>
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Platform
          </span>
          <Link
            href="/download"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Downloader
          </Link>
          <Link
            href="/instagram"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Instagram
          </Link>
          <Link
            href="/tiktok"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            TikTok
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteNav />
      <main>
        <Hero />
        <PlatformCards />
        <FeatureGrid />
        <HowItWorks />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  );
}
