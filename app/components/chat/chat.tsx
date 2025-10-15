'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './chat.module.scss';
import { ChatProps, MessageType, ErrorMessages } from '@/types';
import { ChatLayout } from './chat-layout';

export function Chat({
    chatType = 'basic',
    placeholder,
    onWeatherUpdate,
    onNewsResults,
    newsPreviews,
    children,
}: // new optional side controls
ChatProps) {
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // unique id generator for message tracking
    let uidCounter = 0;
    const makeId = () => `${Date.now()}-${++uidCounter}`;

    const appendMessage = (
        role: 'user' | 'assistant',
        text: string,
        error?: boolean,
        id?: string
    ) => {
        const message = { role, text, error, id } as MessageType;
        setMessages((prev) => [...prev, message]);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        return id || message.id;
    };

    // When parent clears previews, remove any assistant message that said "Top previews ready."
    // This keeps the chat history consistent with the preview area.
    useEffect(() => {
        if (chatType !== 'news') return;
        if (newsPreviews !== null) return;
        setMessages((prev) =>
            prev.filter((m) => m.text !== 'Top previews ready.')
        );
    }, [newsPreviews, chatType]);

    const sendMessage = async (text: string) => {
        // Inform parent that a new query is starting and clear previous previews
        if (chatType === 'news') {
            onNewsResults?.(null);
        }
        try {
            if (chatType === 'news') {
                // News search logic
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
                    if (
                        data?.userMessage &&
                        typeof data.userMessage === 'string'
                    ) {
                        errorMsg = data.userMessage;
                    } else if (code === 'NO_VERIFIED_EVENTS') {
                        const locality =
                            (data?.details && data.details.query) ||
                            'the locality';
                        errorMsg = `No multi-source events found for ${locality}.`;
                    } else if (code === 'PARSE_FAILURE') {
                        errorMsg =
                            "Couldn't understand results. Try a different query.";
                    } else if (code === 'INTERNAL_ERROR') {
                        errorMsg =
                            'An internal error occurred. Please try again later.';
                    } else if (typeof code === 'string') {
                        errorMsg = code;
                    }
                    appendMessage('assistant', errorMsg, true);
                    if (
                        Array.isArray(data.previews) &&
                        data.previews.length > 0
                    ) {
                        onNewsResults?.(data.previews.slice(0, 3));
                    }
                    return;
                }

                if (data.previews && Array.isArray(data.previews)) {
                    onNewsResults?.(data.previews.slice(0, 3));
                    appendMessage('assistant', 'Top previews ready.');
                } else if (data.error) {
                    const code = data.error;
                    if (code === 'PARSE_FAILURE') {
                        appendMessage(
                            'assistant',
                            "Couldn't understand results. Try a different query."
                        );
                    } else {
                        appendMessage(
                            'assistant',
                            ErrorMessages.UNEXPECTED_RESPONSE
                        );
                    }
                    if (data.previews) {
                        onNewsResults?.(data.previews.slice(0, 3));
                    }
                } else {
                    appendMessage(
                        'assistant',
                        ErrorMessages.UNEXPECTED_RESPONSE
                    );
                }
            } else if (chatType === 'weather') {
                // Weather chat logic
                const response = await fetch(
                    `/api/weather?q=${encodeURIComponent(text)}`
                );
                if (!response.ok) {
                    let errorMsg: string = ErrorMessages.TRY_AGAIN;
                    try {
                        const errorData = await response.json();
                        if (errorData && errorData.error) {
                            errorMsg = errorData.error;
                        }
                    } catch {}
                    appendMessage('assistant', errorMsg, true);
                    return;
                }
                const data = await response.json();
                if (data.error) {
                    appendMessage('assistant', data.error, true);
                    return;
                }
                // Show resolvedName if the detected location didn't include a region
                const detectedRegion = data.location?.includes(',');
                const resolvedSuffix =
                    data.resolvedName && !detectedRegion
                        ? ` (Resolved to ${data.resolvedName})`
                        : '';
                appendMessage(
                    'assistant',
                    `Weather data received and displayed in the widget.${resolvedSuffix}`
                );
                if (onWeatherUpdate) {
                    onWeatherUpdate({
                        location: data.location,
                        resolvedName: data.resolvedName,
                        temperature: data.temperature,
                        windspeed: data.windspeed,
                        weathercode: data.weathercode,
                        error: data.error,
                        conditions: '',
                        unit: 'C',
                        timezone_offset: undefined,
                    });
                }
            } else {
                // Basic chat (streaming) logic
                // Build the messages payload from the current conversation (includes the user's message
                // because handleSubmit appends it before calling sendMessage) and send that to the server.
                // include the just-submitted user message to ensure the server receives it
                const messagesPayload = [
                    ...messages.map((m) => ({ role: m.role, content: m.text })),
                    { role: 'user', content: text },
                ];

                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: messagesPayload }),
                });

                if (!response.ok || !response.body) {
                    let errorMsg: string = ErrorMessages.TRY_AGAIN;
                    try {
                        const err = await response.json();
                        if (err?.error) errorMsg = err.error;
                    } catch {}
                    appendMessage('assistant', errorMsg, true);
                    return;
                }

                // Insert a placeholder assistant message which we'll update as chunks arrive
                const placeholderId = makeId();
                appendMessage('assistant', '', false, placeholderId);

                try {
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let buffered = '';

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buffered += decoder.decode(value, { stream: true });
                        let newlineIndex;
                        while ((newlineIndex = buffered.indexOf('\n')) !== -1) {
                            const line = buffered.slice(0, newlineIndex).trim();
                            buffered = buffered.slice(newlineIndex + 1);
                            if (!line) continue;
                            try {
                                const parsed = JSON.parse(line);
                                if (
                                    parsed?.type === 'content' &&
                                    typeof parsed.content === 'string'
                                ) {
                                    setMessages((prev) => {
                                        // find the placeholder by id if present; otherwise fallback to last assistant
                                        const idx = prev.findIndex(
                                            (m) => m.id === placeholderId
                                        );
                                        if (idx === -1) {
                                            const lastIdx = prev
                                                .map((m) => m.role)
                                                .lastIndexOf('assistant');
                                            if (lastIdx === -1)
                                                return [
                                                    ...prev,
                                                    {
                                                        role: 'assistant',
                                                        text: parsed.content,
                                                    },
                                                ];
                                            const updated = [...prev];
                                            const prevText =
                                                updated[lastIdx].text || '';
                                            updated[lastIdx] = {
                                                ...updated[lastIdx],
                                                text: prevText + parsed.content,
                                            };
                                            return updated;
                                        }
                                        const updated = [...prev];
                                        const prevText =
                                            updated[idx].text || '';
                                        updated[idx] = {
                                            ...updated[idx],
                                            text: prevText + parsed.content,
                                        };
                                        return updated;
                                    });
                                    messagesEndRef.current?.scrollIntoView({
                                        behavior: 'smooth',
                                    });
                                } else if (parsed?.type === 'error') {
                                    setMessages((prev) => {
                                        const idx = prev.findIndex(
                                            (m) => m.id === placeholderId
                                        );
                                        if (idx === -1) {
                                            return [
                                                ...prev,
                                                {
                                                    role: 'assistant',
                                                    text:
                                                        parsed.content ||
                                                        'Stream error',
                                                    error: true,
                                                },
                                            ];
                                        }
                                        const updated = [...prev];
                                        updated[idx] = {
                                            ...updated[idx],
                                            text:
                                                parsed.content ||
                                                'Stream error',
                                            error: true,
                                        };
                                        return updated;
                                    });
                                }
                            } catch (err) {
                                console.error(
                                    'Failed to parse stream line',
                                    err
                                );
                            }
                        }
                    }
                } catch (err) {
                    console.error('Streaming error:', err);
                    appendMessage('assistant', ErrorMessages.TRY_AGAIN, true);
                }
            }
        } catch (error) {
            appendMessage('assistant', ErrorMessages.TRY_AGAIN, true);
            console.error('Error sending message:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = userInput.trim();
        if (!trimmedInput || isProcessing) return;
        setUserInput('');
        setIsProcessing(true);
        // Clear previews before sending so parent can update UI immediately
        onNewsResults?.(null);
        appendMessage('user', trimmedInput);
        await sendMessage(trimmedInput);
    };

    const messagesContent = (
        <>
            {messages.map((msg, index) => {
                const baseClass =
                    msg.role === 'user'
                        ? styles['user-message']
                        : styles['assistant-message'];
                const combined = msg.error
                    ? `${baseClass} msg-error`
                    : baseClass;
                return (
                    <div
                        key={msg.id ?? `${msg.role}-${index}`}
                        className={combined}
                    >
                        {msg.text}
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </>
    );

    const inputFormContent = (
        <form onSubmit={handleSubmit} className={styles['input-form']}>
            <input
                type='text'
                className={styles.input}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={
                    isProcessing
                        ? 'Processing...'
                        : placeholder || 'Your question'
                }
                disabled={isProcessing}
            />
            <button
                type='submit'
                className={`${styles.button} ${styles['button-arrow']}`}
                disabled={isProcessing}
                aria-label={isProcessing ? 'Processing' : 'Send message'}
            >
                <span className={styles['button-label']}>
                    {isProcessing ? '...' : 'Send'}
                </span>
            </button>
        </form>
    );

    return (
        <ChatLayout messages={messagesContent} inputForm={inputFormContent}>
            {children}
        </ChatLayout>
    );
}
