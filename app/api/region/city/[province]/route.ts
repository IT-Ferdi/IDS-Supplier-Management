import { NextRequest, NextResponse } from 'next/server';

type WilayahReg = { code?: string; id?: string; name?: string; nama?: string };

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ province: string }> }   
) {
  const { province } = await ctx.params;
  if (!province) {
    return NextResponse.json({ error: 'province code is required' }, { status: 400 });
  }

  const SRC = `https://wilayah.id/api/regencies/${encodeURIComponent(province)}.json`;

  try {
    const res = await fetch(SRC, { next: { } });
    if (!res.ok) throw new Error(`Upstream regencies failed: ${res.status}`);
    const json = await res.json();

    const data = (Array.isArray(json) ? json : json?.data ?? [])
      .map((r: WilayahReg) => ({
        code: String(r.code ?? r.id ?? ''),
        name: String(r.name ?? r.nama ?? ''),
      }))
      .filter((r: { code: any; name: any; }) => r.code && r.name);

    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
