import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const googleGenAI = new GoogleGenAI({});

function slugifyPrompt(p: string): string {
    return (
        p
            .toLowerCase()
            .replace(/[^a-z0-9\s-_]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .slice(0, 120) || 'image'
    );
}

function sendErrorResponse(text: string, obj: unknown): NextResponse {
    console.error(text, obj);
    return NextResponse.json(
        { error: 'IMAGE_GENERATION_FAILED' },
        { status: 500 }
    );
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const prompt = body.prompt;
        if (!prompt || typeof prompt !== 'string') {
            console.error('gen-image: invalid request', { body });
        }

        const response = await googleGenAI.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: prompt,
            config: {
                imageConfig: {
                    aspectRatio: '3:2',
                },
            },
        });

        // Validate response shape before accessing nested properties
        const candidates = response?.candidates;
        if (
            !Array.isArray(candidates) ||
            candidates.length === 0 ||
            !candidates[0].content?.parts?.length
        ) {
            sendErrorResponse('gen-image: missing candidates', response);
        }

        // Find first inlineData part
        for (const part of candidates[0].content.parts) {
            if (part && part.inlineData) {
                const imageData = part.inlineData.data; // base64 string
                const dataUrl = `data:image/png;base64,${imageData}`;

                // Write file to public/genAI (if directory exists). Still return data URL.
                try {
                    const filename = `${slugifyPrompt(prompt)}.png`;
                    const publicDir = path.join(
                        process.cwd(),
                        'public',
                        'genAI'
                    );
                    const filePath = path.join(publicDir, filename);
                    // write file synchronously; if dir missing this will throw
                    fs.writeFileSync(
                        filePath,
                        Buffer.from(imageData, 'base64')
                    );
                } catch (e) {
                    // ignore file write errors; still return the data URL
                    console.error('gen-image: write failed', e);
                }

                return NextResponse.json({ image: dataUrl });
            }
        }

        // No inlineData found in parts
        sendErrorResponse(
            'gen-image: no inlineData parts',
            candidates[0].content
        );
    } catch (err) {
        sendErrorResponse('gen-image: unexpected error', err);
    }
}
