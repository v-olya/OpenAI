'use client';

import React from 'react';
import styles from './page.module.scss';
import NewsSearch from './news-search';

const SearchExample = () => {
    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <NewsSearch />
            </div>
        </main>
    );
};

export default SearchExample;
