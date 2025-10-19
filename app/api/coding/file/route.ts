import { NextResponse } from 'next/server';

// Streams file content from OpenAI: GET /v1/containers/{container_id}/files/{file_id}/content
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const containerId = url.searchParams.get('containerId');
        const fileId = url.searchParams.get('fileId');
        if (!containerId || !fileId) {
            return NextResponse.json(
                { error: 'containerId and fileId are required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Server missing OPENAI_API_KEY' },
                { status: 500 }
            );
        }

        const contentUrl = `https://api.openai.com/v1/containers/${encodeURIComponent(
            containerId
        )}/files/${encodeURIComponent(fileId)}/content`;

        const res = await fetch(contentUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            return NextResponse.json(
                { error: 'Failed to fetch file content', details: text },
                { status: res.status }
            );
        }

        // Pipe through content-type and content-disposition if present, otherwise set octet-stream and a generic filename.
        const headers: Record<string, string> = {};
        const contentType =
            res.headers.get('content-type') ?? 'application/octet-stream';
        headers['Content-Type'] = contentType;

        const disposition = res.headers.get('content-disposition');
        if (disposition) headers['Content-Disposition'] = disposition;

        const body = await res.arrayBuffer();
        return new NextResponse(body, { status: 200, headers });
    } catch (err: any) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
