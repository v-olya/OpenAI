'use client';

import React from 'react';
import styles from './page.module.scss';

const Home = () => {
    const categories = {
        Chat: 'basic-chat',
        Weather: 'weather',
    };

    return (
        <main className={styles.main}>
            <div className={styles.title}>
                Example of an app built with OpenAI API
            </div>
            <div className={styles.container}>
                {Object.entries(categories).map(([name, url]) => (
                    <a
                        key={name}
                        className={`${styles.category} link-base`}
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
