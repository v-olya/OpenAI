'use client';

import { useState, useRef } from 'react';
import styles from './chat.module.scss';
import { ChatProps, MessageType } from '@/app/types';

export function Chat({ onWeatherUpdate }: ChatProps) {
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
                    <div
                        key={index}
                        className={
                            msg.role === 'user'
                                ? styles.userMessage
                                : styles.assistantMessage
                        }
                        style={msg.error ? { color: 'red' } : {}}
                    >
                        {msg.text}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className={styles.inputForm}>
                <input
                    type='text'
                    className={styles.input}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={
                        isProcessing ? 'Processing...' : 'Your question'
                    }
                    disabled={isProcessing}
                />
                <button
                    type='submit'
                    className={`${styles.button} ${styles.buttonArrow}`}
                    disabled={isProcessing}
                    aria-label={isProcessing ? 'Processing' : 'Send message'}
                >
                    <span className={styles.buttonLabel}>
                        {isProcessing ? '...' : 'Send'}
                    </span>
                </button>
            </form>
        </div>
    );
}
