import { ErrorMessages } from '@/utils/types';

type AppendMessage = (
    role: 'user' | 'assistant',
    text: string,
    error?: boolean,
    id?: string
) => string | undefined;

type OnNewsResults = ((previews: any[] | null) => void) | undefined;

export const handleNews = async (
    text: string,
    appendMessage: AppendMessage,
    onNewsResults: OnNewsResults
) => {
    onNewsResults?.(null);

    const systemPrompt = `You are an expert news aggregator. The user will provide a locality name. Using ONLY the search results provided by the fetch_serp function, identify UP TO THREE distinct news events that are currently the most important for that locality.

Rules:
- Prefer events corroborated by multiple sources. Each event selected SHOULD be corroborated by at least TWO distinct sources (different domains) from the SERP results. Events that appear only in a single source should be avoided.
- Do NOT order the events. Return an UNORDERED JSON array with up to 3 objects (1, 2, or 3).
- For each object include these fields: title (7-12 words, synthesized), summary (2-3 sentences, synthesized from multiple sources), sources (array of objects {domain, url}), url (primary article url to link to), imagePrompt (a short descriptive prompt for generating a unique image that represents the event).
- Do NOT include reasoning, scores, or extra text. Output pure JSON: an array with up to three objects.
- If you cannot find any events corroborated by multiple domains, return an error object in JSON explaining the issue.

Remember: the model must synthesize titles and summaries from multiple SERP entries; do NOT copy a single headline. Images must be generated from imagePrompt on the server side.`;

    const response = await fetch('/api/news-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text },
            ],
        }),
    });

    const data = await response.json();
    if (!response.ok) {
        const code = data?.error;
        let errorMsg: string = ErrorMessages.TRY_AGAIN;
        if (data?.userMessage && typeof data.userMessage === 'string') {
            errorMsg = data.userMessage;
        } else if (code === 'NO_VERIFIED_EVENTS') {
            const locality =
                (data?.details && data.details.query) || 'the locality';
            errorMsg = `No multi-source events found for ${locality}.`;
        } else if (code === 'PARSE_FAILURE') {
            errorMsg = "Couldn't understand results. Try a different query.";
        } else if (code === 'INTERNAL_ERROR') {
            errorMsg = 'An internal error occurred. Please try again later.';
        } else if (typeof code === 'string') {
            errorMsg = code;
        }
        appendMessage('assistant', errorMsg, true);
        if (Array.isArray(data.previews) && data.previews.length > 0) {
            onNewsResults?.(data.previews.slice(0, 3));
        }
        return;
    }

    if (data.previews && Array.isArray(data.previews)) {
        onNewsResults?.(data.previews.slice(0, 3));
    } else if (data.error) {
        const code = data.error;
        if (code === 'PARSE_FAILURE') {
            appendMessage(
                'assistant',
                "Couldn't understand results. Try a different query."
            );
        } else {
            appendMessage('assistant', ErrorMessages.UNEXPECTED_RESPONSE);
        }
        if (data.previews) {
            onNewsResults?.(data.previews.slice(0, 3));
        }
    } else {
        appendMessage('assistant', ErrorMessages.UNEXPECTED_RESPONSE);
    }
};
