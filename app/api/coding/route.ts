import { client } from '@/utils/init-client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const uploadedToContainer: string[] = [];
    try {
        const contentType = request.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
            throw new Error('Content type differs from multipart/form-data.');
        }
        const formData = await request.formData();

        const inputValue = formData.get('input');
        const input = typeof inputValue === 'string' ? inputValue : '';
        if (!input) {
            throw new Error('Input field is required.');
        }
        const container = await client.containers.create({ name: 'coding' });

        const sentByClient = formData.getAll('uploaded');
        const apiKey = process.env.OPENAI_API_KEY;

        if (sentByClient.length > 0) {
            for (const entry of sentByClient) {
                if (!(entry instanceof File)) continue;
                const file = entry as File;
                try {
                    const body = new FormData();
                    body.append('file', file, file.name);
                    body.append('purpose', 'user_data');

                    const uploadRes = await fetch(
                        `https://api.openai.com/v1/files`,
                        {
                            method: 'POST',
                            headers: {
                                Authorization: `Bearer ${apiKey}`,
                            },
                            body,
                        }
                    );

                    const uploadJson = await uploadRes.json();
                    if (!uploadRes.ok) {
                        console.error(
                            'Container file upload failed',
                            uploadJson
                        );
                    } else {
                        if (uploadJson.id) {
                            console.log(
                                `Uploaded file to the container ${container.id}, file id: ${uploadJson.id}`,
                                uploadJson
                            );
                            uploadedToContainer.push(uploadJson.id);
                        }
                    }
                } catch (err) {
                    console.error('Uploading file error', err);
                }
            }
        }

        const contentItems = [
            { type: 'input_text' as const, text: input },
            ...uploadedToContainer.map((file_id: string) => {
                return {
                    type: 'input_file' as const,
                    file_id,
                };
            }),
        ];

        let resp: any = null;
        try {
            resp = await client.responses.create({
                model: 'gpt-5-mini',
                tools: [
                    {
                        type: 'code_interpreter',
                        container: container.id,
                    },
                ],
                tool_choice: 'required',
                input: [
                    {
                        role: 'user',
                        content: contentItems,
                    },
                ],
            });

            console.log('Responses result', {
                container: container.id,
                respPreview: resp?.output_text ?? resp?.output ?? null,
            });
        } catch (err) {
            throw err;
        }

        return NextResponse.json({
            status: 'ok',
            uploadedFileIds: uploadedToContainer,
            output: resp.output_text,
        });
    } catch (err: any) {
        const message = err?.message ?? String(err);
        console.error('In /api/coding: ', message, err);
        return NextResponse.json(
            {
                status: 'error',
                message,
                uploadedFileIds: uploadedToContainer ?? [],
            },
            { status: 500 }
        );
    }
}
