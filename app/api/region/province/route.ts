import { NextResponse } from 'next/server';

type WilayahProv = { code?: string; id?: string; name?: string; nama?: string };

const SRC = 'https://wilayah.id/api/provinces.json';

export async function GET() {
    try {
        const res = await fetch(SRC, { next: {  } });
        if (!res.ok) throw new Error(`Upstream provinces failed: ${res.status}`);
        const json = await res.json();

        // Normalisasi ke {code, name}[]
        const data: Array<{ code: string; name: string }> = (Array.isArray(json) ? json : json?.data ?? []).map(
            (p: WilayahProv) => ({
                code: String(p.code ?? p.id ?? ''),
                name: String(p.name ?? p.nama ?? ''),
            })
        ).filter((p: { code: any; name: any; }) => p.code && p.name);

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? 'Failed' }, { status: 502 });
    }
}
