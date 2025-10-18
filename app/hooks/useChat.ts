'use client';

import { useState, useRef, useEffect } from 'react';
import { ErrorMessages } from '@/utils/error-messages';
import type { ChatProps, MessageType } from '@/utils/types';
import { handleNews } from '../components/chat/handlers/news-handler';
import { handleWeather } from '../components/chat/handlers/weather-handler';
import { handleBasic } from '../components/chat/handlers/basic-handler';
import { handleCoding } from '../components/chat/handlers/coding-handler';

export const useChat = ({
    chatType,
    onWeatherUpdate,
    onNewsResults,
}: ChatProps) => {
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadedFileIds, setUploadedFileIds] = useState<
        string[] | undefined
    >(undefined);
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

    const sendMessage = async (text: string, files?: File[]) => {
        try {
            switch (chatType) {
                case 'news':
                    await handleNews(text, appendMessage, onNewsResults);
                    break;
                case 'weather':
                    await handleWeather(text, appendMessage, onWeatherUpdate);
                    break;
                case 'coding': {
                    // Prefer files passed directly to avoid race conditions with UI state
                    const filesToSend = files ?? undefined;
                    const uploadedFileIds = await handleCoding(
                        text,
                        appendMessage,
                        filesToSend
                    );
                    if (uploadedFileIds) {
                        console.log(
                            'useChat: storing uploadedFileIds for cleanup',
                            uploadedFileIds
                        );
                        setUploadedFileIds(uploadedFileIds);
                    }
                    break;
                }
                default: {
                    const messagesPayload = [
                        ...messages.map((m) => ({
                            role: m.role,
                            content: m.text,
                        })),
                        { role: 'user', content: text },
                    ];
                    await handleBasic(
                        messagesPayload,
                        appendMessage,
                        setMessages,
                        makeId
                    );
                }
            }
        } catch (error) {
            appendMessage('assistant', ErrorMessages.TRY_AGAIN, true);
            console.error('Error sending message:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMessage = async (text: string, files?: File[]) => {
        setUserInput('');
        setIsProcessing(true);
        appendMessage('user', text);
        await sendMessage(text, files);
    };

    async function handleSubmit(text: string, files?: File[]): Promise<void> {
        const input = text?.trim();
        if (!input || isProcessing) return;
        onNewsResults?.(null);
        await handleMessage(input, files);
    }

    // When the page is being unloaded, attempt to send a beacon with any remaining uploadedFileIds.
    // Keep a ref of current uploadedFileIds so unload handlers can access it.
    const uploadedFileIdsRef = useRef<string[] | undefined>(uploadedFileIds);
    useEffect(() => {
        uploadedFileIdsRef.current = uploadedFileIds;
    }, [uploadedFileIds]);

    useEffect(() => {
        const sendBeaconIfNeeded = () => {
            const ids = uploadedFileIdsRef.current;
            if (!ids || !ids.length) return;
            const payload = JSON.stringify({ fileIds: ids });
            const blob = new Blob([payload], { type: 'application/json' });
            try {
                const ok = navigator.sendBeacon('/api/coding/cleanup', blob);
                if (!ok) {
                    console.warn('navigator.sendBeacon returned false');
                }
            } catch (err) {
                console.warn('navigator.sendBeacon', err);
            }
        };

        const onPageHide = () => sendBeaconIfNeeded();
        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') sendBeaconIfNeeded();
        };

        window.addEventListener('pagehide', onPageHide as EventListener);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            window.removeEventListener('pagehide', onPageHide as EventListener);
            document.removeEventListener(
                'visibilitychange',
                onVisibilityChange
            );
        };
    }, []);

    // Helper to send cleanup request intentionally
    const sendCleanup = async () => {
        const ids = uploadedFileIdsRef.current;
        if (!ids?.length) return;
        try {
            console.log('useChat: sending cleanup for', ids);
            await fetch('/api/coding/cleanup', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ fileIds: ids }),
            });
        } catch (err) {
            console.warn('Cleanup failed', err);
        } finally {
            setUploadedFileIds(undefined);
            uploadedFileIdsRef.current = undefined;
        }
    };

    // Run a preset: cleanup previous chat, delete the files uploaded to OpenAI Storage,
    // set input, load optional file, and programmatically submit the message.
    const runPreset = async (
        detail: { text: string; code?: string; file?: string },
        fileRowRef?: { setFiles: (files?: File[]) => void } | null
    ) => {
        await sendCleanup();
        fileRowRef?.setFiles(undefined);
        setMessages([]);
        setIsProcessing(false);

        let presetFile: File | undefined;
        if (detail.file) {
            try {
                const fileUrl = `/examples/${encodeURIComponent(detail.file)}`;
                const resp = await fetch(fileUrl);
                const blob = await resp.blob();
                const f = new File([blob], detail.file, {
                    type: blob.type || 'application/octet-stream',
                });
                presetFile = f;
                fileRowRef?.setFiles([f]);
            } catch (err) {
                console.error('Failed to load preset file:', err);
            }
        }
        const composed = `${detail.text}${detail.code || ''}`.trim();
        setUserInput(composed);
        handleMessage(composed, presetFile ? [presetFile] : undefined);
        setUserInput('');
    };

    return {
        messages,
        userInput,
        isProcessing,
        messagesEndRef,
        setUserInput,
        handleSubmit,
        runPreset,
    };
};
