'use client';

import React, { useState } from 'react';
import styles from './page.module.scss';
import { Chat } from '../../components/chat/chat';
import { NewsPreview } from '@/app/types';
import Image from 'next/image';

const SearchExample = () => {
    const [previews, setPreviews] = useState<NewsPreview[] | null>(null);

    const handleNewsResults = (newPreviews: NewsPreview[]) => {
        setPreviews(newPreviews.slice(0, 3));
    };

    // Handle test button clicks - separate from chat
    const runTestCase = async (mode: 'valid' | 'invalid') => {
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
        <div className='preview-list'>
            {previews.map((preview, i) => (
                <div key={i} className={styles.previewCard}>
                    <div className={styles.previewImage}>
                        <Image
                            src={preview.image}
                            alt={preview.title}
                            width={140}
                            height={140}
                            className='preview-image'
                        />
                    </div>
                    <div className={styles.previewContent}>
                        <div className='preview-title'>{preview.title}</div>
                        <div className='preview-summary'>{preview.summary}</div>
                        <div className={styles.sourceCloud}>
                            {Array.isArray(preview.sources) &&
                                preview.sources.map((source, idx) => (
                                    <a
                                        key={idx}
                                        href={source.url}
                                        target='_blank'
                                        rel='noreferrer'
                                        className={styles.sourceBadge}
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

    return (
        <main className='page-centered-with-controls'>
            <div className='centered-container'>
                {/* Left test button */}
                <div className='side-column'>
                    <button
                        onClick={() => runTestCase('valid')}
                        className='control-button'
                    >
                        Get Valid
                    </button>
                </div>

                {/* Centered chat */}
                <div className='center-column'>
                    <div className='center-content'>
                        <Chat
                            chatType='news'
                            placeholder='Search news...'
                            onNewsResults={handleNewsResults}
                        >
                            {previewsContent}
                        </Chat>
                    </div>
                </div>

                {/* Right test button */}
                <div className='side-column'>
                    <button
                        onClick={() => runTestCase('invalid')}
                        className='control-button'
                    >
                        Get Invalid
                    </button>
                </div>
            </div>
        </main>
    );
};

export default SearchExample;
