'use client';

import React from 'react';
import styles from './page.module.scss';

const Home = () => {
    const categories = {
        Chat: 'basic-chat',
        Weather: 'weather',
        Search: '/search',
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
                        href={url.startsWith('/') ? url : `/examples/${url}`}
                    >
                        {name}
                    </a>
                ))}
            </div>
        </main>
    );
};

export default Home;
