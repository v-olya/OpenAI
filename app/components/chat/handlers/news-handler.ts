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
    const data = await response.json();

    if (data.previews && Array.isArray(data.previews)) {
        onNewsResults?.(data.previews);
    } else {
        appendMessage(
            'assistant',
            data.error ?? ErrorMessages.UNEXPECTED_RESPONSE
        );
    }
};
