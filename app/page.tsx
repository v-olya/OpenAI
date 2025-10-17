import styles from './page.module.scss';

const Home = () => {
    const categories = [
        { url: 'basic-chat', title: 'Basic Chat' },
        { url: 'weather', title: 'Weather Widget' },
        { url: 'news-search', title: 'Today in News' },
    ];

    return (
        <main className={styles.main}>
            <h2>Example of an app built with OpenAI API</h2>
            <div className='container home'>
                {categories.map(({ url, title }) => (
                    <a
                        key={url}
                        className={`${styles.category} link-base`}
                        href={`/pages/${url}`}
                    >
                        {title}
                    </a>
                ))}
            </div>
        </main>
    );
};

export default Home;
