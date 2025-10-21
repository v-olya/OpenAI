import Link from 'next/link';
import styles from './page.module.scss';

const Home = () => {
    const categories = [
        { url: 'basic-chat', title: 'Basic Chat' },
        { url: 'weather', title: 'Weather Widget' },
        { url: 'news-search', title: 'Today in the World' },
        { url: 'coding', title: 'Code & File Analysis' },
    ];

    return (
        <main className={styles.main}>
            <h2>Examples of the OpenAI and GoogleGenAI APIs usage</h2>
            <div className='container home'>
                {categories.map(({ url, title }) => (
                    <Link
                        key={url}
                        className={styles.category}
                        href={`/pages/${url}`}
                    >
                        {title}
                    </Link>
                ))}
            </div>
        </main>
    );
};

export default Home;
