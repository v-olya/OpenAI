import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
    const previews = [
        {
            title: 'Local event listing for Torino',
            summary:
                'A local listing for Torino events with limited detail. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            sources: [
                { domain: 'example.com', url: 'https://example.com/torino-1' },
                { domain: 'example.com', url: 'https://example.com/torino-2' },
            ],
            url: 'https://example.com/torino-1',
            image: '/preview.jpg',
            verified: false,
        },
    ];

    const diagnostics = previews.map((p) => ({
        title: p.title,
        domains: p.sources.map((s) => s.domain),
        unique: Array.from(new Set(p.sources.map((s) => s.domain))),
    }));

    return NextResponse.json(
        {
            error: 'NO_VERIFIED_EVENTS',
            userMessage: `No corroborated events available. All results for Torino are mock snippets without concrete event details.`,
            details: { previews, diagnostics },
        },
        { status: 400 }
    );
}
