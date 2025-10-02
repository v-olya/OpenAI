'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
import { Chat } from '../../components/chat/chat';

const SentimentDemo = () => {
    const [sentiment, setSentiment] = useState<string | undefined>(undefined);

    // This demo widget is purely illustrative. In a full demo you'd wire the chat stream to
    // detect sentiments from assistant or user messages and call setSentiment accordingly.
    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <div className={styles.column}>
                    {/* SentimentWidget removed due to missing file */}
                </div>
                <div className={styles.chatContainer}>
                    <div className={styles.chat}>
                        <Chat onSentimentUpdate={(s) => setSentiment(s)} />
                    </div>
                </div>
            </div>
        </main>
    );
};

export default SentimentDemo;
