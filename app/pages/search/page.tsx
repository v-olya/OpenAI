'use client';

import React, { useState } from 'react';
import styles from './page.module.scss';
import { Chat } from '../../components/chat/chat';
import { NewsPreview } from '@/utils/types';
import Image from 'next/image';
import Panel from '../../components/panel/panel';

const SearchExample = () => {
    const [previews, setPreviews] = useState<NewsPreview[] | null>(null);

    const handleNewsResults = (newPreviews: NewsPreview[] | null) => {
        if (!newPreviews) return setPreviews(null);
        setPreviews(newPreviews.slice(0, 3));
    };

    const previewsContent = previews && (
        <>
            {previews.map((preview, i) => (
                <div
                    key={preview.url ?? `preview-${i}`}
                    className={styles['preview-card']}
                >
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
                                        key={
                                            source.url ??
                                            `${source.domain ?? 'src'}-${idx}`
                                        }
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
        </>
    );

    const today = new Date().toDateString();

    return (
        <main className='container'>
            <Panel>
                <h2>Enter a region</h2>
                <p>
                    to see the Top news for <br />
                </p>
                <h3 className='emphasis'>{today}</h3>
                <p>
                    <br />
                    LLM will pick the most important ones, describe them
                    briefly, and illustrate with pictures
                </p>
            </Panel>
            <Chat
                chatType='news'
                placeholder='Search news...'
                onNewsResults={handleNewsResults}
                newsPreviews={previews}
            >
                {previewsContent}
            </Chat>
        </main>
    );
};

export default SearchExample;
