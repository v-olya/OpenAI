'use client';

import Link from 'next/link';
import React from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error?: Error;
    reset?: () => void;
}) {
    // Client-side error UI. Use the provided reset() when available (Next.js will pass it)
    const handleRefresh = () => {
        if (typeof reset === 'function') {
            try {
                reset();
                return;
            } catch {
                // fall through to reload
            }
        }
        if (typeof window !== 'undefined' && window.location) {
            window.location.reload();
        }
    };

    return (
        <main className='page-center'>
            <h1 className='heading-lg'>Something went wrong</h1>
            <p className='muted'>
                An unexpected error occurred while rendering this page. You can
                try refreshing, or go back to the home page.
            </p>
            {error?.message ? (
                <pre className='pre-error'>{String(error.message)}</pre>
            ) : null}
            <div className='spaced-top'>
                <button
                    className='btn-small btn-primary'
                    onClick={handleRefresh}
                >
                    Refresh
                </button>
                <Link href='/' className='home-link link-base ml-8'>
                    Take me home!
                </Link>
            </div>
        </main>
    );
}
