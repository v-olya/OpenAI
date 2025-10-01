'use client';

import React, { useState, useRef } from 'react';
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
    error?: string;
}

interface StreamResponse {
    type: 'content' | 'weather_data';
    content?: string;
    data?: WeatherData;
    error?: string;
}

interface ChatProps {
    onWeatherUpdate?: (data: WeatherData) => void;
    onWeatherRequest?: () => void;
}

export function Chat({ onWeatherUpdate, onWeatherRequest }: ChatProps) {
    const [userInput, setUserInput] = useState('');
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const appendMessage = (
        role: 'user' | 'assistant',
        text: string,
        error?: boolean
    ) => {
        setMessages((prev) => [...prev, { role, text, error }]);
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
        scrollToBottom();
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
                                    onWeatherUpdate(data.data);
                                    if (data.error) {
                                        appendToLastMessage(
                                            `Error getting weather: ${data.error}\n`,
                                            true
                                        );
                                    }
                                }
                                break;
                            case 'content':
                                if (data.content) {
                                    appendToLastMessage(data.content);
                                }
                                break;
                            default:
                                console.warn('Unknown response type:', data);
                        }
                    } catch (e) {
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
        } catch (error) {
            appendToLastMessage(
                '\nAn error occurred while processing the response.\n',
                true
            );
            console.error('Error processing stream:', error);
        }
    };

    const sendMessage = async (text: string) => {
        try {
            if (text.toLowerCase().includes('weather')) {
                onWeatherRequest?.();
            }

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
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await processStreamResponse(response);
        } catch (error) {
            console.error('Error sending message:', error);
            appendMessage(
                'assistant',
                'An error occurred. Please try again.',
                true
            );
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
                    className={styles.button}
                    disabled={isProcessing}
                >
                    {isProcessing ? '...' : 'Send'}
                </button>
            </form>
        </div>
    );
}
