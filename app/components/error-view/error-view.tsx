'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

export default function ErrorView({
    title = 'Something went wrong',
    message,
    showPre = false,
    children,
}: {
    title?: string;
    message?: string;
    showPre?: boolean;
    children?: ReactNode;
}) {
    return (
        <main className='layout-centered'>
            <h1 className='heading-lg'>{title}</h1>
            {message ? <p className='muted'>{message}</p> : null}
            {showPre && message ? (
                <pre className='pre-error'>{String(message)}</pre>
            ) : null}
            <div className='spaced-top'>
                {children}
                <Link href='/' className='menu-link'>
                    Take me home!
                </Link>
            </div>
        </main>
    );
}
