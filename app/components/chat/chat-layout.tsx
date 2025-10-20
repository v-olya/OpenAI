'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import chatStyles from './chat.module.scss';
import MenuUnderwatch from './menu-underwatch';
import { ChatProps } from '@/utils/types';
import { dispatchNewChat } from '@/utils/dispatch-new-chat';

interface ChatLayoutProps {
    children?: ReactNode;
    messages: ReactNode;
    inputForm: ReactNode;
    chatType?: ChatProps['chatType'];
}

export function ChatLayout({
    children,
    messages,
    inputForm,
    chatType,
}: ChatLayoutProps) {
    return (
        <div className={chatStyles.chat}>
            <div className='top-menu'>
                <MenuUnderwatch />
                <Link
                    href='/'
                    className={`${chatStyles['menu-link']} menu-link`}
                    aria-label='Home'
                >
                    Home
                </Link>
                {chatType === 'coding' && (
                    <Link
                        href=':'
                        className={`${chatStyles['menu-link']} menu-link`}
                        aria-label='Restart the chat'
                        onClick={(e) => {
                            e.preventDefault();
                            (e.target as HTMLAnchorElement).blur();
                            dispatchNewChat({ text: '' });
                        }}
                    >
                        Restart
                    </Link>
                )}
            </div>
            <div id='messages' className={chatStyles.messages}>
                {messages}
                {children}
            </div>
            {inputForm}
        </div>
    );
}
