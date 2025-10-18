'use client';

import dynamic from 'next/dynamic';
import styles from './chat.module.scss';
import type { ChatProps } from '@/utils/types';
import { ChatLayout } from './chat-layout';
import { useChat } from '@/hooks/useChat';
import { useEffect, useRef } from 'react';
import type { FileRowHandle } from './file-row';

const FileRow = dynamic(() => import('./file-row'), { ssr: false }) as any;

export function Chat({
    chatType = 'basic',
    onWeatherUpdate,
    onNewsResults,
    newsPreviews,
    children,
}: ChatProps) {
    const {
        messages,
        userInput,
        isProcessing,
        messagesEndRef,
        setUserInput,
        handleSubmit,
        runPreset,
    } = useChat({
        chatType,
        onWeatherUpdate,
        onNewsResults,
        newsPreviews,
    });

    const fileRowRef = useRef<FileRowHandle | null>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<{ text: string; file?: string }>)
                .detail;
            void runPreset(detail, fileRowRef.current ?? null);
        };

        window.addEventListener('openai:preset', handler as EventListener);
        return () =>
            window.removeEventListener(
                'openai:preset',
                handler as EventListener
            );
    }, [runPreset]);

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
        <>
            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    const files = fileRowRef.current?.getFiles?.();
                    await handleSubmit(userInput, files);
                }}
                className={styles['input-form']}
            >
                <input
                    type='text'
                    className={styles.input}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={
                        isProcessing ? 'Processing...' : 'Your message...'
                    }
                    disabled={isProcessing}
                />
                <button
                    type='submit'
                    className={`${styles.button} ${styles['button-arrow']}`}
                    disabled={isProcessing}
                    title={isProcessing ? 'Processing' : 'Send message'}
                />
            </form>

            {chatType === 'coding' && <FileRow ref={fileRowRef} />}
        </>
    );

    return (
        <ChatLayout messages={messagesContent} inputForm={inputFormContent}>
            {children}
        </ChatLayout>
    );
}
