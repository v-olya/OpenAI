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
    options?: {
        fileRowRef?:
            | ({
                  // setFiles may return a promise when conversion is async
                  setFiles: (files?: File[]) => Promise<void>;
                  getFiles?: () => File[] | undefined;
              } | null)
            | null;
    }
) => {
    const { chatType, onWeatherUpdate, onNewsResults } = props;
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerIdRef = useRef<string | undefined>(undefined);
    const isNewSession = !containerIdRef.current;
    const uploadedFileIdsRef = useRef<string[] | undefined>(undefined);
    // Metadata for the last-uploaded files so we can detect when the user resubmits the same file(s)
    const uploadedFileMetaRef = useRef<
        { name: string; size: number; lastModified: number }[] | undefined
    >(undefined);

    const uploadHasBeenChanged = (
        newFiles: File[] | undefined,
        previousMeta?:
            | { name: string; size: number; lastModified: number }[]
            | null
    ) => {
        const prevLen = previousMeta?.length ?? 0;
        const newLen = newFiles?.length ?? 0;

        if (newLen !== prevLen) {
            return true;
        }
        if (newLen > 0 && newFiles) {
            return newFiles.some((file, idx) => {
                const prev = previousMeta?.[idx];
                return (
                    !prev ||
                    prev.name !== file.name ||
                    prev.size !== file.size ||
                    prev.lastModified !== file.lastModified
                );
            });
        }
        return prevLen > 0;
    };

    const startNewSession = () => {
        uploadedFileIdsRef.current = undefined;
        uploadedFileMetaRef.current = undefined;
        containerIdRef.current = undefined;
        setMessages([]);
        // Any additional side-effects when a new session starts.
    };

    const restartChat = async () => {
        try {
            // Clear files in the FileRow UI if provided
            await options?.fileRowRef?.setFiles?.(undefined);
        } finally {
            startNewSession();
            setUserInput('');
        }
    };

    const appendMessage = (
        role: 'user' | 'assistant',
        text: string,
        error?: boolean,
        id?: string
    ) => {
        const message = { role, text, error, id } as MessageType;
        // If this is a main-link-message, remove any previous main-link messages and keep the latest one in chat.
        const MAIN_LINK_MARKER = '__MAIN_LINK_MESSAGE__';
        if (
            role === 'assistant' &&
            typeof text === 'string' &&
            text.startsWith(MAIN_LINK_MARKER)
        ) {
            setMessages((prev) => [
                ...prev.filter(
                    (m) =>
                        !(
                            m.role === 'assistant' &&
                            typeof m.text === 'string' &&
                            m.text.startsWith(MAIN_LINK_MARKER)
                        )
                ),
                message,
            ]);
        } else {
            setMessages((prev) => [...prev, message]);
        }
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        return id || message.id;
    };

    let uidCounter = 0; // used for basic chat only
    const makeId = () => `${Date.now()}-${++uidCounter}`;

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
                    const result: any = await handleCoding(
                        text,
                        appendMessage,
                        isNewSession ? files : undefined,
                        isNewSession ? [] : uploadedFileIdsRef.current,
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

                        // Update metadata if we actually uploaded new files
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
            const shouldClearSession = uploadHasBeenChanged(
                files,
                uploadedFileMetaRef.current
            );
            if (shouldClearSession) {
                if (uploadedFileIdsRef.current?.length) {
                    await cleanupUploadedFileIds(uploadedFileIdsRef.current);
                }
                startNewSession();
            }
        }
        setUserInput('');
        appendMessage('user', text);
        setIsProcessing(true);
        await sendMessage(text, files);
    };

    async function handleSubmit(text: string, files?: File[]): Promise<void> {
        const input = text?.trim();
        if (!input || isProcessing) return;
        onNewsResults?.(null);
        await handleMessage(input, files);
    }

    // When the page is being unloaded, attempt to send a beacon with any remaining uploadedFileIds.
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

    const runPreset = async (detail: {
        text: string;
        code?: string;
        file?: string;
    }) => {
        if (isProcessing) {
            return;
        }
        setIsProcessing(true);
        // A preset always starts a new chat
        await restartChat();
        const composed = `${detail.text}${detail.code || ''}`.trim();
        if (!composed) {
            setIsProcessing(false);
            return;
        }
        // else setIsProcessing(false) will be called in sendMessage
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
                // Set the file into the UI. FileRow will convert text-like files to PDF asynchronously
                await options?.fileRowRef?.setFiles?.([f]);
            } catch {
                console.error('Failed to load preset file:');
            }
        }
        // Read converted files from the FileRow handle (if provided)
        const convertedFiles = options?.fileRowRef?.getFiles?.();
        // Programmatically submit the preset message.
        const filesToSend = convertedFiles?.length
            ? convertedFiles
            : presetFile
            ? [presetFile]
            : undefined;

        await sendMessage(composed, filesToSend);
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
            runPresetRef.current(detail);
        };

        window.addEventListener('openai:newChat', handler as EventListener);
        return () =>
            window.removeEventListener(
                'openai:newChat',
                handler as EventListener
            );
    }, [chatType, options?.fileRowRef]);

    // Notify user when files were auto-converted to PDF
    useEffect(() => {
        const onConverted = () => {
            // We don't receive a mapping payload. Read the current files from the FileRow handle
            const files = options?.fileRowRef?.getFiles?.() ?? [];
            if (files.length) {
                const names = files.map((f) => `• ${f.name}`);
                appendMessage(
                    'assistant',
                    `The following files were converted to PDF so the upload would be accepted by the OpenAI API: ${names.join(
                        ' '
                    )}`
                );
            }
        };
        window.addEventListener(
            'openai:fileConverted',
            onConverted as EventListener
        );
        return () =>
            window.removeEventListener(
                'openai:fileConverted',
                onConverted as EventListener
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
