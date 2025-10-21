import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        let body: any = {};
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            body = await request.json();
        } else {
            const txt = await request.text();
            try {
                body = txt ? JSON.parse(txt) : {};
            } catch {
                body = {};
            }
        }

        const { fileIds } = body as {
            fileIds?: string[];
        };

        try {
            console.log('/api/coding/cleanup: incoming', {
                time: new Date().toISOString(),
                contentType: contentType,
                fileCount: Array.isArray(fileIds) ? fileIds.length : 0,
            });
        } catch {
            // noop
        }
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
                    throw new Error(await res.text());
                }
            } catch (err) {
                console.error('Failed to delete file', id, err);
            }
        }

        console.log('/api/coding/cleanup: Deleted ', deleted);

        return NextResponse.json({ status: 'ok', deleted });
    } catch (err: any) {
        return NextResponse.json(
            { status: 'error', message: err?.message || String(err) },
            { status: 500 }
        );
    }
}
