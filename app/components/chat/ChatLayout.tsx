'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import chatStyles from './chat.module.scss';

interface ChatLayoutProps {
    children?: ReactNode;
    messages: ReactNode;
    inputForm: ReactNode;
}

export function ChatLayout({ children, messages, inputForm }: ChatLayoutProps) {
    return (
        <div className='layout-chat'>
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
        </div>
    );
}
