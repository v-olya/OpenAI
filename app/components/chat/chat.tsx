'use client';

import styles from './chat.module.scss';
import { ChatProps } from '@/utils/types';
import { ChatLayout } from './chat-layout';
import { useChat } from '@/hooks/useChat';

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
    } = useChat({
        chatType,
        onWeatherUpdate,
        onNewsResults,
        newsPreviews,
    });

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
        <form onSubmit={handleSubmit} className={styles['input-form']}>
            <input
                type='text'
                className={styles.input}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={isProcessing ? 'Processing...' : 'Your message...'}
                disabled={isProcessing}
            />
            <button
                type='submit'
                className={`${styles.button} ${styles['button-arrow']}`}
                disabled={isProcessing}
                aria-label={isProcessing ? 'Processing' : 'Send message'}
            >
                <span className={styles['button-label']}>
                    {isProcessing ? '...' : 'Send'}
                </span>
            </button>
        </form>
    );

    return (
        <ChatLayout messages={messagesContent} inputForm={inputFormContent}>
            {children}
        </ChatLayout>
    );
}
