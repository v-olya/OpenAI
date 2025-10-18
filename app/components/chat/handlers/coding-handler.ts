import { ErrorMessages } from '@/utils/error-messages';
import type { AppendMessage } from '@/utils/types';

export const handleCoding = async (
    input: string,
    appendMessage: AppendMessage,
    uploadedFiles?: File[]
) => {
    try {
        const form = new FormData();
        form.append('input', input);
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
                    String(errBody.error ?? '') || ErrorMessages.TRY_AGAIN,
                    true
                );
                if (errBody?.uploadedFileIds) {
                    return errBody.uploadedFileIds;
                }
            }
            return null;
        }
        try {
            const data = await response.json();
            console.log('response', response);
            if (!data) {
                throw new Error();
            }

            if (typeof data.output === 'string') {
                appendMessage('assistant', data.output);
            }
            // Send uploaded file ids for cleanup
            return data.uploadedFileIds;
        } catch (err) {
            console.error('Failed to parse /api/coding response JSON', err);
            return null;
        }
    } catch (err) {
        console.error('Error in handleCoding:', err);
        appendMessage('assistant', ErrorMessages.TRY_AGAIN, true);
    }
};
