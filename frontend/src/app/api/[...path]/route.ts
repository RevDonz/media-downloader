// Proxy semua /api/* ke backend FastAPI.
// Dipakai saat menjalankan Next sendiri (dev / next start tanpa nginx).
// Lebih andal dari rewrites: tanpa timeout ~30s dan tetap meneruskan streaming (Range).
// Di produksi dengan nginx, /api langsung ke backend dan route ini tak terpakai.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 600;

const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:8000";

// header hop-by-hop yang tidak boleh diteruskan
const HOP = ["connection", "keep-alive", "transfer-encoding", "upgrade", "host"];

async function proxy(req: Request, path: string[]) {
  const url = new URL(req.url);
  const target = `${BACKEND}/api/${path.join("/")}${url.search}`;

  const headers = new Headers(req.headers);
  HOP.forEach((h) => headers.delete(h));

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const out = new Headers(upstream.headers);
  HOP.forEach((h) => out.delete(h));
  // stream apa adanya → Content-Range/Content-Length/206 untuk seek tetap terjaga
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: out,
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: Request, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function POST(req: Request, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function PUT(req: Request, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function DELETE(req: Request, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
