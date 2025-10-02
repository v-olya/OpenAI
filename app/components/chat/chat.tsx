'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './chat.module.css';
import Markdown from 'react-markdown';
import type { Message } from '@/app/openai';

type DisplayMessage = {
    role: 'user' | 'assistant';
    text: string;
    error?: boolean;
};

const UserMessage = ({ text }: { text: string }) => (
    <div className={styles.userMessage}>{text}</div>
);

const AssistantMessage = ({
    text,
    error,
}: {
    text: string;
    error?: boolean;
}) => (
    <div className={`${styles.assistantMessage} ${error ? styles.error : ''}`}>
        <Markdown>{text}</Markdown>
    </div>
);

const Message = ({ role, text, error }: DisplayMessage) => {
    switch (role) {
        case 'user':
            return <UserMessage text={text} />;
        case 'assistant':
            return <AssistantMessage text={text} error={error} />;
        default:
            return null;
    }
};

interface WeatherData {
    location: string;
    temperature: number;
    conditions: string;
    weathercode?: number;
    windspeed?: number;
    unit?: string;
    error?: string;
}

interface StreamResponse {
    type: 'content' | 'weather_data' | 'error';
    content?: string;
    data?: WeatherData;
    error?: string;
}

interface ChatProps {
    onWeatherUpdate?: (data: WeatherData) => void;
    onWeatherRequest?: () => void;
    onSentimentUpdate?: (sentiment: string) => void;
}

export function Chat({
    onWeatherUpdate,
    // onWeatherRequest,
    onSentimentUpdate,
}: ChatProps) {
    const [userInput, setUserInput] = useState('');
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const appendMessage = (
        role: 'user' | 'assistant',
        text: string,
        error?: boolean
    ) => {
        setMessages((prev) => [...prev, { role, text, error }]);
        // Run sentiment server-side for assistant messages (with local fallback)
        if (role === 'assistant' && onSentimentUpdate) {
            (async () => {
                try {
                    const res = await fetch('/api/sentiment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text }),
                    });
                    if (res.ok) {
                        const j = await res.json();
                        if (j?.sentiment) {
                            onSentimentUpdate(j.sentiment);
                            return;
                        }
                    }
                } catch {
                    // ignore, fallback
                }
                // fallback to local heuristic
                onSentimentUpdate(analyzeSentiment(text));
            })();
        }
        scrollToBottom();
    };

    const appendToLastMessage = (text: string, error?: boolean) => {
        setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            const updatedLastMessage = {
                ...lastMessage,
                text: lastMessage.text + text,
                error: lastMessage.error || error,
            };
            return [...prev.slice(0, -1), updatedLastMessage];
        });
        // Re-run sentiment detection when assistant content is appended
        if (onSentimentUpdate) {
            // best-effort: use the last message after update via a small timeout to read state
            setTimeout(() => {
                // const el = messagesEndRef.current?.previousElementSibling as HTMLElement | undefined;
                // fallback: analyze the aggregated text we were given
                try {
                    // We don't have direct access to latest messages variable here synchronously,
                    // so use the provided 'text' chunk to refine sentiment.
                    (async () => {
                        try {
                            const res = await fetch('/api/sentiment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ text }),
                            });
                            if (res.ok) {
                                const j = await res.json();
                                if (j?.sentiment) {
                                    onSentimentUpdate(j.sentiment);
                                    return;
                                }
                            }
                        } catch {
                            /* ignore */
                        }
                        onSentimentUpdate(analyzeSentiment(text));
                    })();
                } catch {
                    /* ignore */
                }
            }, 0);
        }
        scrollToBottom();
    };

    // Simple heuristic to determine sentiment from text
    const analyzeSentiment = (text: string) => {
        if (!text) return 'Neutral';
        const lower = text.toLowerCase();
        const positive = [
            'good',
            'great',
            'excellent',
            'happy',
            'love',
            'wonderful',
            'awesome',
            'amazing',
        ];
        const negative = [
            'bad',
            'sad',
            'terrible',
            'awful',
            'hate',
            'angry',
            'disappointing',
            'problem',
        ];
        const posCount = positive.reduce(
            (acc, w) => acc + (lower.includes(w) ? 1 : 0),
            0
        );
        const negCount = negative.reduce(
            (acc, w) => acc + (lower.includes(w) ? 1 : 0),
            0
        );
        if (posCount > negCount) return 'Positive';
        if (negCount > posCount) return 'Negative';
        return 'Neutral';
    };

    const processStreamResponse = async (response: Response) => {
        if (!response.body) {
            throw new Error('No response body received');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            appendMessage('assistant', '');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                buffer += chunk;

                while (buffer.includes('\n')) {
                    const newlineIndex = buffer.indexOf('\n');
                    const line = buffer.slice(0, newlineIndex);
                    buffer = buffer.slice(newlineIndex + 1);

                    if (!line.trim()) continue;

                    try {
                        const data = JSON.parse(line) as StreamResponse;

                        switch (data.type) {
                            case 'weather_data':
                                if (onWeatherUpdate && data.data) {
                                    // Convert weathercode to conditions string
                                    const weatherCodeMap: Record<
                                        number,
                                        string
                                    > = {
                                        0: 'Clear',
                                        1: 'Mainly clear',
                                        2: 'Partly cloudy',
                                        3: 'Overcast',
                                        45: 'Fog',
                                        48: 'Depositing rime fog',
                                        51: 'Light drizzle',
                                        53: 'Moderate drizzle',
                                        55: 'Dense drizzle',
                                        56: 'Light freezing drizzle',
                                        57: 'Dense freezing drizzle',
                                        61: 'Slight rain',
                                        63: 'Moderate rain',
                                        66: 'Light freezing rain',
                                        67: 'Heavy freezing rain',
                                        71: 'Slight snow fall',
                                        73: 'Moderate snow fall',
                                        75: 'Heavy snow fall',
                                        77: 'Snow grains',
                                        80: 'Slight rain showers',
                                        81: 'Moderate rain showers',
                                        82: 'Violent rain showers',
                                        85: 'Slight snow showers',
                                        86: 'Heavy snow showers',
                                        95: 'Thunderstorm',
                                        96: 'Thunderstorm with slight hail',
                                        99: 'Thunderstorm with heavy hail',
                                    };
                                    const normalized = {
                                        location: data.data.location,
                                        temperature: data.data.temperature,
                                        conditions:
                                            typeof data.data.weathercode ===
                                            'number'
                                                ? weatherCodeMap[
                                                      data.data.weathercode
                                                  ]
                                                : '',
                                        weathercode: data.data.weathercode,
                                        windspeed: data.data.windspeed,
                                        error: data.data.error,
                                    };
                                    onWeatherUpdate(normalized);
                                }
                                // Optionally, display weather info in chat as well:
                                if (data.data) {
                                    // Only show the update phrase, not duplicated weather details
                                    appendToLastMessage(
                                        `The widget has been updated with the weather conditions in ${data.data.location}.\n`,
                                        false
                                    );
                                }
                                break;
                            case 'content':
                                if (data.content) {
                                    appendToLastMessage(data.content);
                                }
                                break;
                            case 'error':
                                appendToLastMessage(
                                    "Sorry, I couldn't find a city in your message. Please ask about the weather in a specific city.",
                                    true
                                );
                                break;
                            default:
                            //
                        }
                    } catch {
                        if (line.trim()) {
                            appendToLastMessage(line + '\n');
                        }
                    }
                }

                if (buffer.trim() && !buffer.includes('{')) {
                    appendToLastMessage(buffer);
                    buffer = '';
                }
            }
            // Ensure function returns after stream ends
            return;
        } catch (error) {
            console.error('Error processing stream:', error);
            appendToLastMessage(
                '\nAn error occurred while processing the response.\n',
                true
            );
        }
    };

    const sendMessage = async (text: string) => {
        try {
            // Send full user message to backend for city detection

            // Only proceed to chat response after weather is fetched (or no city found)
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [
                        ...messages.map((msg) => ({
                            role: msg.role === 'user' ? 'user' : 'assistant',
                            content: msg.text,
                        })),
                        {
                            role: 'user',
                            content: text,
                        },
                    ] as Message[],
                }),
            });

            if (!response.ok) {
                // Try to parse error message from backend
                let errorMsg = 'An error occurred. Please try again.';
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.content) {
                        errorMsg = errorData.content;
                    }
                } catch {}
                appendMessage('assistant', errorMsg, true);
                return;
            }

            await processStreamResponse(response);
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
        <div className={styles.chatContainer}>
            <div className={styles.messages}>
                {messages.map((msg, index) => (
                    <Message
                        key={index}
                        role={msg.role}
                        text={msg.text}
                        error={msg.error}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form
                onSubmit={handleSubmit}
                className={`${styles.inputForm} ${styles.clearfix}`}
            >
                <input
                    type='text'
                    className={styles.input}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={
                        isProcessing ? 'Processing...' : 'Enter your question'
                    }
                    disabled={isProcessing}
                />
                <button
                    type='submit'
                    className={`${styles.button} ${styles.buttonArrow}`}
                    disabled={isProcessing}
                    aria-label={isProcessing ? 'Processing' : 'Send message'}
                >
                    {/* Visible text is hidden for visual users; screen readers will read aria-label. */}
                    <span className={styles.buttonLabel}>
                        {isProcessing ? '...' : 'Send'}
                    </span>
                </button>
            </form>
        </div>
    );
}
