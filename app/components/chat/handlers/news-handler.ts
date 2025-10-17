import { getResponseError } from '@/utils/get-response-error';
import { ErrorMessages } from '@/utils/types';

type AppendMessage = (
    role: 'user' | 'assistant',
    text: string,
    error?: boolean,
    id?: string
) => string | undefined;

type OnNewsResults = ((previews: any[] | null) => void) | undefined;

export const handleNews = async (
    region: string,
    appendMessage: AppendMessage,
    onNewsResults: OnNewsResults
) => {
    onNewsResults?.(null);

    const response = await fetch(
        `/api/news-search?q=${encodeURIComponent(region)}`
    );

    if (!response.ok) {
        appendMessage('assistant', await getResponseError(response), true);
        return;
    }
    // OK response: parse JSON and return previews or an error message
    try {
        const data: any = await response.json();

        if (Array.isArray(data?.previews)) {
            onNewsResults?.(data.previews);
            return;
        }
        appendMessage(
            'assistant',
            data?.error ?? ErrorMessages.UNEXPECTED_RESPONSE
        );
    } catch {
        // JSON parse error or empty body
        appendMessage('assistant', ErrorMessages.UNEXPECTED_RESPONSE, true);
    }
};
