'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import chatStyles from './chat.module.scss';

interface ChatLayoutProps {
    children?: ReactNode;
    messages: ReactNode;
    inputForm: ReactNode;
    controlBar?: ReactNode;
}

export function ChatLayout({ children, messages, inputForm, controlBar }: ChatLayoutProps) {
    return (
        <div className="page-chat">
            {controlBar}
            <div className={chatStyles.chatContainer}>
                <Link href='/' className={`${chatStyles.homeLink} home-link link-base`} aria-label='Home'>
                    Home
                </Link>
                <div className={chatStyles.messages}>
                    {messages}
                    {children}
                </div>
                {inputForm}
            </div>
        </div>
    );
}