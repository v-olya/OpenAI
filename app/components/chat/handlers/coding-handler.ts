import { ErrorMessages } from '@/utils/error-messages';
import type { AppendMessage } from '@/utils/types';

export const handleCoding = async (
    input: string,
    appendMessage: AppendMessage,
    uploadedFiles?: File[],
    existingFileIds?: string[] | undefined,
    containerId?: string | undefined
) => {
    try {
        const form = new FormData();
        form.append('input', input);
        if (existingFileIds?.length) {
            form.append('existingFileIds', JSON.stringify(existingFileIds));
        }
        if (containerId) {
            form.append('containerId', containerId);
        }
        if (uploadedFiles?.length) {
            for (const file of uploadedFiles) {
                form.append('uploaded', file);
            }
        }

        const response = await fetch('/api/coding', {
            method: 'POST',
            body: form,
        });

        if (!response.ok) {
            // Parse error body: the server includes uploadedFileIds even when the remote API call failed.
            // Return those file_ids, so the client can perform cleanup on unload.
            let errBody = null;
            try {
                errBody = await response.json();
            } finally {
                appendMessage(
                    'assistant',
                    String(errBody?.error ?? '') || ErrorMessages.TRY_AGAIN,
                    true
                );
                if (errBody) {
                    return {
                        uploadedFileIds: errBody.uploadedFileIds,
                        containerId: errBody.containerId,
                    } as any;
                }
            }
            return;
        }
        try {
            const data = await response.json();
            if (typeof data?.output === 'string') {
                appendMessage('assistant', data.output);
            }

            // If containerFiles are present, append an assistant message with links to download them.
            if (
                Array.isArray(data?.containerFiles) &&
                data.containerFiles.length
            ) {
                try {
                    const payload = JSON.stringify(data.containerFiles);
                    appendMessage(
                        'assistant',
                        `__MAIN_LINK_MESSAGE__${payload}`
                    );
                } catch (e) {
                    console.warn('Failed to serialize containerFiles', e);
                }
            }

            // Return uploaded file ids and containerId so the client can reuse them
            return {
                uploadedFileIds: data.uploadedFileIds,
                containerId: data.containerId,
            } as any;
        } catch (err) {
            console.error('Failed to get JSON from /api/coding response', err);
        }
    } catch {
        appendMessage('assistant', ErrorMessages.TRY_AGAIN, true);
    }
};
