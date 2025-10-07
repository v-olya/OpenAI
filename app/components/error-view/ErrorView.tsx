'use client';

import React from 'react';
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
    children?: React.ReactNode;
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
                <Link href='/' className='home-link link-base ml-8'>
                    Take me home!
                </Link>
            </div>
        </main>
    );
}
