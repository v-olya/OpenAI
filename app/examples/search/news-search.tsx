'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.scss';
import chatStyles from '../../components/chat/chat.module.scss';
import Image from 'next/image';

type Message = {
    role: 'user' | 'assistant';
    text: string;
    error?: boolean;
};

export default function NewsSearch() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const appendMessage = (
        role: Message['role'],
        text: string,
        error?: boolean
    ) => {
        setMessages((prev) => [...prev, { role, text, error }]);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Helper to handle deterministic test responses (both valid and invalid)
    const handleTestResponse = async (resp: Response) => {
        const data = await resp.json();
        if (!resp.ok) {
            const code = data?.error;
            let errorMsg = 'An error occurred. Please try again.';
            if (data?.userMessage && typeof data.userMessage === 'string') {
                errorMsg = data.userMessage;
            } else if (code === 'NO_VERIFIED_EVENTS') {
                const locality =
                    (data?.details && data.details.query) || 'the locality';
                errorMsg = `No multi-source events found for ${locality}.`;
            }
            appendMessage('assistant', errorMsg, true);
            if (
                Array.isArray(data.details?.previews) &&
                data.details.previews.length > 0
            ) {
                setPreviews(data.details.previews.slice(0, 3));
            }
            return;
        }
        if (data.previews && Array.isArray(data.previews)) {
            setPreviews(data.previews.slice(0, 3));
            appendMessage('assistant', 'Top previews ready.');
        }
    };

    type Preview = {
        title: string;
        summary: string;
        sources?: { domain?: string; url?: string }[];
        url: string;
        image: string; // url
    };

    const [previews, setPreviews] = useState<Preview[] | null>(null);
    const [testMode, setTestMode] = useState<'mock' | 'valid' | 'invalid'>(
        'mock'
    );

    const sendMessage = async (text: string) => {
        // If a test mode is selected, call the deterministic test endpoints instead
        if (testMode === 'valid') {
            try {
                setIsProcessing(true);
                const r = await fetch('/api/news-search/test-valid');
                await handleTestResponse(r);
            } finally {
                setIsProcessing(false);
            }
            return;
        }
        if (testMode === 'invalid') {
            try {
                setIsProcessing(true);
                const r = await fetch('/api/news-search/test-invalid');
                await handleTestResponse(r);
            } finally {
                setIsProcessing(false);
            }
            return;
        }

        try {
            // POST messages to the server which runs the function-enabled model flow
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
                // Map standardized error codes to user-friendly grouped messages
                const code = data?.error;
                let errorMsg = 'An error occurred. Please try again.';
                if (data?.userMessage && typeof data.userMessage === 'string') {
                    errorMsg = data.userMessage;
                } else if (code === 'NO_VERIFIED_EVENTS') {
                    const locality =
                        (data?.details && data.details.query) || 'the locality';
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
                // If previews exist in the payload, still show them
                if (Array.isArray(data.previews) && data.previews.length > 0) {
                    setPreviews(data.previews.slice(0, 3));
                }
                return;
            }

            if (data.previews && Array.isArray(data.previews)) {
                setPreviews(data.previews.slice(0, 3));
                appendMessage('assistant', 'Top previews ready.');
            } else if (data.error) {
                // Parse-failure case returned with 200 but includes error code
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
                    setPreviews(data.previews.slice(0, 3));
                }
            } else if (data.content) {
                appendMessage(
                    'assistant',
                    'Could not parse structured previews from the model output. Please check server logs.'
                );
            } else {
                appendMessage('assistant', 'Unexpected response from server');
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

    return (
        <div>
            {/* Control bar: testing utilities placed outside the chat container */}
            <div className={styles.controlBar + ' flex-row-gap-12'}>
                <div className='flex-row'>
                    <label className='label-compact'>Test mode:</label>
                    <select
                        value={testMode}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            setTestMode(
                                e.target.value as 'mock' | 'valid' | 'invalid'
                            )
                        }
                        className='select-compact'
                    >
                        <option value='mock'>Mock SERP (default)</option>
                        <option value='valid'>Use test-valid</option>
                        <option value='invalid'>Use test-invalid</option>
                    </select>
                </div>
                <div className='flex-row'>
                    <button
                        className={chatStyles.button}
                        onClick={async () => {
                            setIsProcessing(true);
                            try {
                                const r = await fetch(
                                    '/api/news-search/test-valid'
                                );
                                await handleTestResponse(r);
                            } finally {
                                setIsProcessing(false);
                            }
                        }}
                    >
                        Get Valid
                    </button>
                    <button
                        className={chatStyles.button}
                        onClick={async () => {
                            setIsProcessing(true);
                            try {
                                const r = await fetch(
                                    '/api/news-search/test-invalid'
                                );
                                await handleTestResponse(r);
                            } finally {
                                setIsProcessing(false);
                            }
                        }}
                    >
                        Get Invalid
                    </button>
                </div>
            </div>

            <div className={chatStyles.chatContainer}>
                {/* Home link intentionally placed as a direct child of chatContainer so it is positioned absolutely and does not scroll with messages */}
                <Link href='/' className={`${chatStyles.homeLink} link-base`}>
                    Home
                </Link>

                <div className={chatStyles.messages}>
                    {messages.map((msg, index) => {
                        const baseClass =
                            msg.role === 'user'
                                ? chatStyles.userMessage
                                : chatStyles.assistantMessage;
                        const combinedClass = msg.error
                            ? `${baseClass} msg-error`
                            : baseClass;
                        return (
                            <div key={index} className={combinedClass}>
                                {msg.text}
                            </div>
                        );
                    })}
                    {previews && (
                        <div className='preview-list'>
                            {previews.map((pRaw, i) => {
                                const p = pRaw as Preview;
                                return (
                                    <div key={i} className={styles.previewCard}>
                                        <div className={styles.previewImage}>
                                            <Image
                                                src={p.image}
                                                alt={p.title}
                                                width={140}
                                                height={140}
                                                className='preview-image'
                                            />
                                        </div>
                                        <div className={styles.previewContent}>
                                            <div className='preview-title'>
                                                {p.title}
                                            </div>
                                            <div className='preview-summary'>
                                                {p.summary}
                                            </div>
                                            <div className={styles.sourceCloud}>
                                                {Array.isArray(p.sources) &&
                                                    p.sources.map((s, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={s.url}
                                                            target='_blank'
                                                            rel='noreferrer'
                                                            className={
                                                                styles.sourceBadge
                                                            }
                                                        >
                                                            {s.domain || s.url}
                                                        </a>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSubmit} className={chatStyles.inputForm}>
                    <input
                        type='text'
                        className={chatStyles.input}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={
                            isProcessing ? 'Processing...' : 'Search news...'
                        }
                        disabled={isProcessing}
                    />
                    <button
                        type='submit'
                        className={`${chatStyles.button} ${chatStyles.buttonArrow}`}
                        disabled={isProcessing}
                        aria-label={
                            isProcessing ? 'Processing' : 'Send message'
                        }
                    >
                        <span className={chatStyles.buttonLabel}>
                            {isProcessing ? '...' : 'Search'}
                        </span>
                    </button>
                </form>
            </div>
        </div>
    );
}
