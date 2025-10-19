'use client';

import { useState, useRef, useEffect } from 'react';
import { ErrorMessages } from '@/utils/error-messages';
import type { ChatProps, MessageType } from '@/utils/types';
import { handleNews } from '../components/chat/handlers/news-handler';
import { handleWeather } from '../components/chat/handlers/weather-handler';
import { handleBasic } from '../components/chat/handlers/basic-handler';
import { handleCoding } from '../components/chat/handlers/coding-handler';

export const useChat = (
    props: ChatProps,
    options?: { fileRowRef?: { setFiles: (files?: File[]) => void } | null }
) => {
    const { chatType, onWeatherUpdate, onNewsResults } = props;
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // A helper function to determine if the files have changed between submissions
    const filesHaveChanged = (
        newFiles: File[] | undefined,
        previousMeta: { name: string; size: number; lastModified: number }[]
    ) => {
        if (newFiles?.length !== previousMeta.length) {
            return true;
        }
        if (newFiles?.length) {
            return newFiles.some((file, idx) => {
                const prev = previousMeta[idx];
                return (
                    !prev ||
                    prev.name !== file.name ||
                    prev.size !== file.size ||
                    prev.lastModified !== file.lastModified
                );
            });
        }
        return previousMeta.length > 0;
    };

    // A helper function to clean up the session state when files change
    const clearSessionIfChanged = async (
        newFiles: File[] | undefined,
        previousIds: string[],
        previousMeta: { name: string; size: number; lastModified: number }[]
    ) => {
        const shouldClear = filesHaveChanged(newFiles, previousMeta);
        if (shouldClear) {
            if (previousIds.length) {
                await cleanupUploadedFileIds(previousIds);
            }
            uploadedFileIdsRef.current = undefined;
            uploadedFileMetaRef.current = undefined;
            containerIdRef.current = undefined;
            setMessages([]); // Clear chat history for the new session
            return true;
        }
        return false;
    };

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
                    const previousIds = uploadedFileIdsRef.current ?? [];
                    const isNewSession = !containerIdRef.current;

                    const reuseIds = isNewSession ? [] : previousIds;
                    const filesToSend = isNewSession ? files : undefined;

                    const result: any = await handleCoding(
                        text,
                        appendMessage,
                        filesToSend,
                        reuseIds,
                        containerIdRef.current
                    );

                    // If the server returned new file IDs, persist them for the session.
                    if (result?.uploadedFileIds?.length) {
                        const newIds = result.uploadedFileIds;
                        console.log(
                            'Storing uploadedFileIds for cleanup',
                            newIds
                        );

                        uploadedFileIdsRef.current = newIds;
                        // Only update metadata if we actually uploaded new files
                        if (isNewSession && files?.length) {
                            uploadedFileMetaRef.current = files.map((f) => ({
                                name: f.name,
                                size: f.size,
                                lastModified: f.lastModified,
                            }));
                        }
                        if (result.containerId)
                            containerIdRef.current = result.containerId;
                    } else if (result?.containerId) {
                        // Persist container ID even if no files were uploaded
                        containerIdRef.current = result.containerId;
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
        if (chatType === 'coding') {
            await clearSessionIfChanged(
                files,
                uploadedFileIdsRef.current ?? [],
                uploadedFileMetaRef.current ?? []
            );
        }

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
    const uploadedFileIdsRef = useRef<string[] | undefined>(undefined);
    // Keep metadata for the last-uploaded files so we can detect when the user resubmits the same file(s)
    const uploadedFileMetaRef = useRef<
        { name: string; size: number; lastModified: number }[] | undefined
    >(undefined);
    const containerIdRef = useRef<string | undefined>(undefined);

    const cleanupUploadedFileIds = async (ids: string[]) => {
        if (!ids?.length) return;
        try {
            const resp = await fetch('/api/coding/cleanup', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({ fileIds: ids }),
            });
            if (!resp.ok) {
                throw new Error(await resp.text());
            }
            console.log(
                'CleanupUploaded:',
                resp.status,
                'deleting files:',
                ids
            );
        } catch (err) {
            console.log('Failed to cleanup uploaded files', err);
        }
    };

    useEffect(() => {
        if (chatType !== 'coding') return;

        const sendBeaconIfNeeded = () => {
            const ids = uploadedFileIdsRef.current;
            if (!ids || !ids.length) return;

            const payload = JSON.stringify({ fileIds: ids });
            const blob = new Blob([payload], { type: 'application/json' });
            // Fire-and-forget clean up request.
            navigator.sendBeacon('/api/coding/cleanup', blob);
        };

        const onPageHide = () => sendBeaconIfNeeded();
        window.addEventListener('pagehide', onPageHide);

        return () => {
            window.removeEventListener('pagehide', onPageHide);
        };
    }, [chatType]);

    const runPreset = async (
        detail: { text: string; code?: string; file?: string },
        fileRowRef?: { setFiles: (files?: File[]) => void } | null
    ) => {
        // A preset always starts a new session.
        await clearSessionIfChanged(
            // If a preset has a file, that's the new file list. Otherwise, it's empty.
            detail.file ? [] : undefined,
            uploadedFileIdsRef.current ?? [],
            uploadedFileMetaRef.current ?? []
        );

        // Clear UI state for the new preset
        fileRowRef?.setFiles(undefined);

        const composed = `${detail.text}${detail.code || ''}`.trim();
        setUserInput('');
        setIsProcessing(true);
        appendMessage('user', composed);

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
        // Programmatically submit the preset message.
        await sendMessage(composed, presetFile ? [presetFile] : undefined);
    };

    // Keep a ref to the latest runPreset so the listener can call it
    const runPresetRef = useRef(runPreset);
    runPresetRef.current = runPreset;

    useEffect(() => {
        if (chatType !== 'coding' && chatType !== 'weather') return;

        const handler = (e: Event) => {
            const detail = (
                e as CustomEvent<{ text: string; code?: string; file?: string }>
            ).detail;
            runPresetRef.current(detail, options?.fileRowRef ?? null);
        };

        window.addEventListener('openai:preset', handler as EventListener);
        return () =>
            window.removeEventListener(
                'openai:preset',
                handler as EventListener
            );
    }, [chatType, options?.fileRowRef]);

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
