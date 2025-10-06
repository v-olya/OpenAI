'use client';

import React from 'react';
import styles from './page.module.scss';
import { Chat } from '../../components/chat/chat';

const Home = () => {
    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <Chat />
            </div>
        </main>
    );
};

export default Home;
