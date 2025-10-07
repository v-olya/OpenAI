'use client';

import { useState, useRef } from 'react';
import styles from './chat.module.scss';
import { ChatProps, MessageType } from '@/app/types';
import { ChatLayout } from './ChatLayout';

export function Chat({
    onWeatherUpdate,
    chatType = 'weather',
    placeholder,
    onNewsResults,
    children,
    controlBarLeft,
    controlBarRight,
}: // new optional side controls
ChatProps) {
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const appendMessage = (
        role: 'user' | 'assistant',
        text: string,
        error?: boolean
    ) => {
        setMessages((prev) => [...prev, { role, text, error }]);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = async (text: string) => {
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
                    let errorMsg = 'An error occurred. Please try again.';
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
                            'Unexpected response from server.'
                        );
                    }
                    if (data.previews) {
                        onNewsResults?.(data.previews.slice(0, 3));
                    }
                } else {
                    appendMessage(
                        'assistant',
                        'Unexpected response from server'
                    );
                }
            } else {
                // Weather chat logic
                const response = await fetch(
                    `/api/weather?q=${encodeURIComponent(text)}`
                );
                if (!response.ok) {
                    let errorMsg = 'An error occurred. Please try again.';
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
                appendMessage(
                    'assistant',
                    'Weather data received and displayed in the widget.'
                );
                if (onWeatherUpdate) {
                    onWeatherUpdate({
                        location: data.location,
                        temperature: data.temperature,
                        windspeed: data.windspeed,
                        weathercode: data.weathercode,
                        error: data.error,
                        conditions: '',
                        unit: 'C',
                        timezone_offset: undefined,
                    });
                }
            }
        } catch (error) {
            appendMessage(
                'assistant',
                'An error occurred. Please try again.',
                true
            );
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
                    <div key={index} className={combined}>
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
        <ChatLayout
            messages={messagesContent}
            inputForm={inputFormContent}
            controlBarLeft={controlBarLeft}
            controlBarRight={controlBarRight}
        >
            {children}
        </ChatLayout>
    );
}
