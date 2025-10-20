import { client } from '@/utils/init-client';
import { NextResponse } from 'next/server';
const FILES_URL = 'https://api.openai.com/v1/files';
const getContainerFilesURL = (containerId: string) =>
    `https://api.openai.com/v1/containers/${containerId}/files`;
export async function POST(request: Request) {
    const uploadedToContainer: string[] = [];
    let containerId: string | undefined = undefined;
    try {
        const contentType = request.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
            throw new Error('Content type differs from multipart/form-data.');
        }
        const formData = await request.formData();

        const input = (formData.get('input') as string) ?? '';

        // Support reusing an existing container for the session.
        const providedContainerId = formData.get('containerId');
        containerId =
            typeof providedContainerId === 'string' && providedContainerId;
        if (!containerId) {
            const container = await client.containers.create({
                name: 'coding',
            });
            containerId = container.id;
        }

        const existing = formData.get('existingFileIds');
        let existingFileIds: string[] = [];
        try {
            if (typeof existing === 'string' && existing?.trim().length) {
                const parsed = JSON.parse(existing);
                if (Array.isArray(parsed)) existingFileIds = parsed as string[];
            }
        } catch {
            existingFileIds = [];
        }

        const sentByClient = formData.getAll('uploaded') ?? [];
        const apiKey = process.env.OPENAI_API_KEY;

        if (sentByClient?.length) {
            for (const entry of sentByClient) {
                if (!(entry instanceof File)) continue;
                const file = entry as File;
                try {
                    const body = new FormData();
                    body.append('file', file, file.name);
                    body.append('purpose', 'user_data');

                    const uploadRes = await fetch(FILES_URL, {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                        },
                        body,
                    });

                    const uploadJson = await uploadRes.json();
                    if (!uploadRes.ok) {
                        console.error(
                            'Container file upload failed',
                            uploadJson
                        );
                    } else {
                        if (uploadJson.id) {
                            console.log(
                                `Uploaded file to the container ${containerId}, file id: ${uploadJson.id}`
                            );
                            uploadedToContainer.push(uploadJson.id);
                        }
                    }
                } catch (err) {
                    console.error('Uploading file error', err);
                }
            }
        }

        // If the client uploaded files in this request, do NOT include previous existingFileIds
        const includeExisting = !sentByClient.length && existingFileIds.length;
        const contentItems = [
            { type: 'input_text' as const, text: input },
            // Include existing file ids when no fresh uploads are present in this request
            ...(includeExisting
                ? existingFileIds.map((file_id: string) => ({
                      type: 'input_file' as const,
                      file_id,
                  }))
                : []),
            // Include newly uploaded files
            ...uploadedToContainer.map((file_id: string) => ({
                type: 'input_file' as const,
                file_id,
            })),
        ];

        let resp: any = null;
        const previousResponseId =
            formData.get('previousResponseId') ?? undefined;
        console.log('pr', previousResponseId);
        resp = await client.responses.create({
            model: 'gpt-5-mini',
            tools: [
                {
                    type: 'code_interpreter',
                    container: containerId,
                },
            ],
            tool_choice: 'required',
            input: [
                {
                    role: 'system',
                    content: [
                        {
                            type: 'input_text' as const,
                            text: `Do NOT include any file URLs, local filesystem paths, container identifiers, or sandbox links in the output_text: all that stuff will be processed separately.
                            Examples of forbidden content: sandbox:/..., /mnt/..., file://..., container:..., cntr_... , or markdown links whose hrefs point to such paths.
                            Prefer to save the result as a container file rather than simply write the code to the output text.
                            But in any case, in the output_text, you should provide human-readable explanation of what was done.`,
                        },
                    ],
                },
                {
                    role: 'user',
                    content: contentItems,
                },
            ],
            previous_response_id: previousResponseId as string,
        });

        console.log('Responses result:', containerId, resp.status);

        // Fetch list of files in the container and pick non-user sources
        let containerFiles: {
            file_id: string;
            container_id: string;
            filename: string;
        }[] = [];
        try {
            const filesRes = await fetch(getContainerFilesURL(containerId!), {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            });

            const filesJson = await filesRes.json();
            containerFiles = Array.isArray(filesJson?.data)
                ? filesJson.data
                      .filter((f: any) => f?.source !== 'user')
                      .map((f: any) => ({
                          file_id: f.id,
                          container_id: f.container_id ?? containerId,
                          filename: f.path?.split('/').pop() ?? f.id,
                          download: `/api/coding/file?containerId=${encodeURIComponent(
                              f.container_id ?? containerId!
                          )}&fileId=${encodeURIComponent(f.id)}`,
                      }))
                : [];

            console.log('Container files:', containerFiles);
        } catch (err) {
            console.error('Failed to list container files', err);
        }

        /**  It turned out that the code_interpreter does not always include file citations in the response.
            So we've implemented more reliable way to bring the newly created files to the client.
     
        const citations: {
            file_id: string;
            container_id?: string;
            ext: string;
        }[] = [];
        const seen = new Set<string>();
        const out = Array.isArray(resp?.output) ? resp.output : [resp.output];
        console.log(out);
        try {
            for (const block of out) {
                if (!Array.isArray(block?.content)) {
                    continue;
                }
                for (const item of block.content) {
                    for (const a of item.annotations) {
                        if (a?.type !== 'container_file_citation') {
                            continue;
                        }
                        if (!a.file_id || typeof a.file_id !== 'string') {
                            continue;
                        }
                        const key = `${a.container_id || ''}::${a.file_id}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            citations.push({
                                file_id: a.file_id,
                                container_id: a.container_id,
                                ext: a.filename?.split('.').pop() ?? 'txt',
                            });
                        }
                    }
                }
            }
        } catch {
            console.error('Failed to extract file paths from response');
        }
        console.log('Citations extracted:', citations);
        **/

        return NextResponse.json({
            status: 'ok',
            uploadedFileIds: uploadedToContainer,
            output: resp.output_text,
            containerId,
            // All non-user container files (download URL is included on each item)
            containerFiles,
            // Only expose the id if resp doesn't contain an error.
            previousResponseId:
                resp && !resp?.error && typeof resp.id === 'string'
                    ? resp.id
                    : undefined,
        });
    } catch (err: any) {
        const message = err?.message ?? String(err);
        return NextResponse.json(
            {
                status: 'error',
                error: message,
                uploadedFileIds: uploadedToContainer ?? [],
                // Return the containerId if it was created earlier in this request
                containerId: containerId ?? undefined,
            },
            { status: 500 }
        );
    }
}
