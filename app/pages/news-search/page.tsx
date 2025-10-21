'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import styles from './page.module.scss';
const Chat = dynamic(() =>
    import('../../components/chat/chat').then((m) => m.Chat)
);
import type { NewsPreview } from '@/utils/types';
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
    const fetchGenerationRef = useRef(0);
    // store AbortController for the current generation to abortwhen a new generation starts
    const generationControllersRef = useRef<AbortController[] | null>(null);

    const handleNewsResults = (newPreviews: any[] | null) => {
        const generationId = fetchGenerationRef.current + 1;
        fetchGenerationRef.current = generationId;
        generationControllersRef.current?.forEach((c) => {
            c.abort();
        });
        generationControllersRef.current = [];

        if (!newPreviews) {
            setPreviews(null);
            return;
        }

        const mapped = newPreviews.map(toPreview);
        setPreviews(mapped);

        mapped.forEach((preview, idx) => {
            if (!preview.imagePrompt) return;

            const controller = new AbortController();
            const signal = controller.signal;
            generationControllersRef.current!.push(controller);

            fetch('/api/gen-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: preview.imagePrompt }),
                signal,
            })
                .then((response) => (response.ok ? response.json() : null))
                .then((payload) => {
                    // if aborted, fetch will be rejected
                    if (!payload?.image) return;
                    if (fetchGenerationRef.current !== generationId) return;

                    setPreviews((prev) => {
                        if (!prev || prev.length <= idx) return prev;

                        const current = prev[idx];
                        if (current?.image === payload.image) return prev;

                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], image: payload.image };
                        return copy;
                    });
                })
                .catch((err) => {
                    if (err?.name === 'AbortError') return;
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
