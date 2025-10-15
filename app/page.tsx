'use client';

import styles from './page.module.scss';

const Home = () => {
    const categories = {
        Chat: 'basic-chat',
        Weather: 'weather',
        Search: 'search',
    };

    return (
        <main className={styles.main}>
            <h2>Example of an app built with OpenAI API</h2>
            <div className='container home'>
                {Object.entries(categories).map(([name, url]) => (
                    <a
                        key={name}
                        className={`${styles.category} link-base`}
                        href={`/pages/${url}`}
                    >
                        {name}
                    </a>
                ))}
            </div>
        </main>
    );
};

export default Home;
