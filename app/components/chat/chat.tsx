'use client';

import dynamic from 'next/dynamic';
import styles from './chat.module.scss';
import type { ChatProps } from '@/utils/types';
import { ChatLayout } from './chat-layout';
import { useChat } from '@/hooks/useChat';
import { useRef } from 'react';
import type { FileRowHandle } from './file-row';

const FileRow = dynamic(() => import('./file-row'), { ssr: false }) as any;

export function Chat({
    chatType = 'basic',
    onWeatherUpdate,
    onNewsResults,
    newsPreviews,
    children,
}: ChatProps) {
    const fileRowRef = useRef<FileRowHandle | null>(null);

    const {
        messages,
        userInput,
        isProcessing,
        messagesEndRef,
        setUserInput,
        handleSubmit,
    } = useChat(
        {
            chatType,
            onWeatherUpdate,
            onNewsResults,
            newsPreviews,
        },
        {
            fileRowRef: {
                setFiles: (files?: File[]) =>
                    fileRowRef.current?.setFiles?.(files),
            },
        }
    );

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

            {chatType === 'coding' && (
                <FileRow ref={fileRowRef} disabled={isProcessing} />
            )}
        </>
    );

    return (
        <ChatLayout messages={messagesContent} inputForm={inputFormContent}>
            {children}
        </ChatLayout>
    );
}
