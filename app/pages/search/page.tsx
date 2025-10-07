'use client';

import React, { useState } from 'react';
import styles from './page.module.scss';
import { Chat } from '../../components/chat/chat';
import { NewsPreview } from '@/app/types';
import Image from 'next/image';

const SearchExample = () => {
    const [previews, setPreviews] = useState<NewsPreview[] | null>(null);
    const testMode = process.env.NEXT_PUBLIC_NEWS_SEARCH_FAKE_BACKEND + 1;

    const handleNewsResults = (newPreviews: NewsPreview[] | null) => {
        if (!newPreviews) return setPreviews(null);
        setPreviews(newPreviews.slice(0, 3));
    };

    // Handle test button clicks - separate from chat
    const runTestCase = async (mode: 'valid' | 'invalid') => {
        // Clear previews immediately when developer triggers a test
        setPreviews(null);
        try {
            const endpoint =
                mode === 'valid'
                    ? '/api/news-search/test-valid'
                    : '/api/news-search/test-invalid';
            const response = await fetch(endpoint);
            const data = await response.json();

            if (!response.ok) {
                if (
                    Array.isArray(data.details?.previews) &&
                    data.details.previews.length > 0
                ) {
                    setPreviews(data.details.previews.slice(0, 3));
                }
            } else if (data.previews && Array.isArray(data.previews)) {
                setPreviews(data.previews.slice(0, 3));
            }
        } catch (error) {
            console.error('Test failed:', error);
        }
    };

    const previewsContent = previews && (
        <div>
            {previews.map((preview, i) => (
                <div key={i} className={styles['preview-card']}>
                    <div className={styles['preview-image']}>
                        <Image
                            src={preview.image}
                            alt={preview.title}
                            width={140}
                            height={140}
                            className='preview-image'
                        />
                    </div>
                    <div className={styles['preview-content']}>
                        <div className='preview-title'>{preview.title}</div>
                        <div className='preview-summary'>{preview.summary}</div>
                        <div className={styles['source-cloud']}>
                            {Array.isArray(preview.sources) &&
                                preview.sources.map((source, idx) => (
                                    <a
                                        key={idx}
                                        href={source.url}
                                        target='_blank'
                                        rel='noreferrer'
                                        className={styles['source-badge']}
                                    >
                                        {source.domain || source.url}
                                    </a>
                                ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const leftControl = testMode && (
        <div className={`${styles['side-column']}`}>
            <button
                className={styles['control-button']}
                onClick={() => runTestCase('valid')}
            >
                Get Valid
            </button>
        </div>
    );

    const rightControl = testMode && (
        <div className={`${styles['side-column']}`}>
            <button
                className={styles['control-button']}
                onClick={() => runTestCase('invalid')}
            >
                Get Invalid
            </button>
        </div>
    );

    return (
        <main className='container'>
            {leftControl}
            <Chat
                chatType='news'
                placeholder='Search news...'
                onNewsResults={handleNewsResults}
                newsPreviews={previews}
            >
                {previewsContent}
            </Chat>
            {rightControl}
        </main>
    );
};

export default SearchExample;
