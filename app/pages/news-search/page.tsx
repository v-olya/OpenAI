'use client';

import { useState } from 'react';
import styles from './page.module.scss';
import { Chat } from '../../components/chat/chat';
import { NewsPreview } from '@/utils/types';
import Image from 'next/image';
import Panel from '../../components/left-panel/panel';

const toPreview = (p: any, i: number): NewsPreview => ({
    title: p.title ?? '',
    summary: p.summary ?? '',
    sources: p.sources ?? [],
    url: p.url ?? p.sources?.[0]?.url ?? `preview-${i}`,
    image: '',
    imagePrompt: p.imagePrompt ?? p.image ?? '',
});

const imageSrc = (v?: string) => {
    if (!v) return '/preview.jpg';
    if (v.startsWith('data:')) return v;
    return v.length > 50 ? `data:image/png;base64,${v}` : '/preview.jpg';
};

export default function SearchExample() {
    const [previews, setPreviews] = useState<NewsPreview[] | null>(null);

    const handleNewsResults = (newPreviews: any[] | null) => {
        if (!newPreviews) return setPreviews(null);

        const mapped = newPreviews.map(toPreview);
        setPreviews(mapped);

        // fetch generated images concurrently and update state once
        Promise.allSettled(
            mapped.map((p) =>
                fetch('/api/gen-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: p.imagePrompt }),
                })
                    .then((r) => (r.ok ? r.json() : null))
                    .catch(() => null)
            )
        ).then((results) => {
            setPreviews((prev) => {
                if (!prev) return prev;
                const copy = [...prev];
                results.forEach((res, idx) => {
                    if (res.status === 'fulfilled' && res.value?.image) {
                        copy[idx] = { ...copy[idx], image: res.value.image };
                    }
                });
                return copy;
            });
        });
    };

    const previewsContent = previews?.map((preview, i) => (
        <div
            key={`${preview.url ?? 'preview'}-${i}`}
            className={styles['preview-card']}
        >
            <div className={styles['preview-image']}>
                <Image
                    src={imageSrc(preview.image)}
                    alt={preview.imagePrompt}
                    height={144}
                    width={216}
                    className='preview-image'
                    unoptimized
                />
            </div>

            <div className={styles['preview-content']}>
                <div className={styles['preview-title']}>{preview.title}</div>
                <div className={styles['preview-summary']}>
                    {preview.summary}
                </div>
                <div className={styles['source-cloud']}>
                    {Array.isArray(preview.sources) &&
                        preview.sources.map((source, idx) => (
                            <a
                                key={`${source.domain ?? 'src'}-${idx}`}
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
    ));

    const today = new Date().toDateString();

    return (
        <main className='container'>
            <Panel>
                <h2>Enter a region</h2>
                <p>to see the Top news for today,</p>
                <h3 className='emphasis'>{today}</h3>
                <p>
                    <br />
                    LLM will pick the most impactful ones, describe them
                    briefly, and illustrate with pictures
                </p>
            </Panel>
            <Chat
                chatType='news'
                onNewsResults={handleNewsResults}
                newsPreviews={previews}
            >
                {previewsContent}
            </Chat>
        </main>
    );
}
