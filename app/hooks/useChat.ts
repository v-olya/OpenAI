'use client';

import { useState, useRef } from 'react';
import { ChatProps, MessageType, ErrorMessages } from '@/utils/types';
import { handleNews } from '../components/chat/handlers/news-handler';
import { handleWeather } from '../components/chat/handlers/weather-handler';
import { handleBasic } from '../components/chat/handlers/basic-handler';

export const useChat = ({
    chatType,
    onWeatherUpdate,
    onNewsResults,
}: ChatProps) => {
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    const sendMessage = async (text: string) => {
        try {
            if (chatType === 'news') {
                await handleNews(text, appendMessage, onNewsResults);
            } else if (chatType === 'weather') {
                await handleWeather(text, appendMessage, onWeatherUpdate);
            } else {
                const messagesPayload = [
                    ...messages.map((m) => ({ role: m.role, content: m.text })),
                    { role: 'user', content: text },
                ];
                await handleBasic(
                    messagesPayload,
                    appendMessage,
                    setMessages,
                    makeId
                );
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
        onNewsResults?.(null);
        appendMessage('user', trimmedInput);
        await sendMessage(trimmedInput);
    };

    return {
        messages,
        userInput,
        isProcessing,
        messagesEndRef,
        setUserInput,
        handleSubmit,
    };
};
