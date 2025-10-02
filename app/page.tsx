'use client';

import React from 'react';
import styles from './page.module.css';

const Home = () => {
    const categories = {
        Chat: 'basic-chat',
        Weather: 'weather',
    };

    return (
        <main className={styles.main}>
            <div className={styles.title}>
                A sample apps built with OpenAI API
            </div>
            <div className={styles.container}>
                {Object.entries(categories).map(([name, url]) => (
                    <a
                        key={name}
                        className={styles.category}
                        href={`/examples/${url}`}
                    >
                        {name}
                    </a>
                ))}
            </div>
        </main>
    );
};

export default Home;
