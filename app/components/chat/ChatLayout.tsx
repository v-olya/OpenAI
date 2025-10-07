'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import chatStyles from './chat.module.scss';

interface ChatLayoutProps {
    children?: ReactNode;
    messages: ReactNode;
    inputForm: ReactNode;
    /** optional left-side control area rendered outside the chat container */
    controlBarLeft?: ReactNode;
    /** optional right-side control area rendered outside the chat container */
    controlBarRight?: ReactNode;
}

export function ChatLayout({
    children,
    messages,
    inputForm,
    controlBarLeft,
    controlBarRight,
}: ChatLayoutProps) {
    return (
        <div className='layout-chat'>
            {/* left control bar (e.g. Get Valid) */}
            {controlBarLeft}

            <div
                className={`${chatStyles['chat-container']} layout-chat-container`}
            >
                <Link
                    href='/'
                    className={`${chatStyles['home-link']} home-link link-base`}
                    aria-label='Home'
                >
                    Home
                </Link>
                <div className={`${chatStyles.messages} layout-chat-messages`}>
                    {messages}
                    {children}
                </div>
                {inputForm}
            </div>

            {/* right control bar (e.g. Get Invalid) */}
            {controlBarRight}
        </div>
    );
}
