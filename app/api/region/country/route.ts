// app/api/countries/route.ts
import { NextResponse } from 'next/server';

type FirstOrgResp = {
  status: string;
  code: number;
  version: string;
  access: string;
  data: Record<
    string,
    { country: string; region: string; code: string; iso_3166_2: string }
  >;
};

/** GET /api/countries
 *  Output: { code: string; name: string; region?: string }[]
 */
export async function GET() {
  try {
    // Cache 24 jam agar hemat kuota & cepat
    const res = await fetch('https://api.first.org/data/v1/countries', {
      next: {  },
      headers: {
        // optional – sebagian besar tak perlu header khusus
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Upstream countries API failed' },
        { status: 502 },
      );
    }

    const json = (await res.json()) as FirstOrgResp;

    const countries = Object.entries(json.data).map(([code, v]) => ({
      code,
      name: v.country,
      region: v.region,
    }));

    countries.sort((a, b) => a.name.localeCompare(b.name, 'en'));

    return NextResponse.json(countries, { status: 200 });
  } catch (err) {
    console.error('countries route error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
