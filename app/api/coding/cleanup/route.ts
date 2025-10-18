import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // Accept both JSON body and raw blobs sent via navigator.sendBeacon
        let body: any;
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            body = await request.json();
        } else {
            // Fallback: try to read text and JSON-parse it
            const txt = await request.text();
            try {
                body = txt ? JSON.parse(txt) : {};
            } catch {
                body = {};
            }
        }

        const { fileIds } = body as { fileIds?: string[] };
        const apiKey = process.env.OPENAI_API_KEY;
        if (!fileIds || !fileIds.length) {
            return NextResponse.json({ status: 'ok', deleted: [] });
        }

        const deleted: string[] = [];
        for (const id of fileIds) {
            try {
                const res = await fetch(
                    `https://api.openai.com/v1/files/${id}`,
                    {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${apiKey}` },
                    }
                );
                if (res.ok) {
                    deleted.push(id);
                } else {
                    const errText = await res.text();
                    console.warn(
                        'Failed to delete file',
                        id,
                        res.status,
                        errText
                    );
                }
            } catch (err) {
                console.warn('Failed to delete file', id, err);
            }
        }

        return NextResponse.json({ status: 'ok', deleted });
    } catch (err: any) {
        return NextResponse.json(
            { status: 'error', message: err?.message || String(err) },
            { status: 500 }
        );
    }
}
