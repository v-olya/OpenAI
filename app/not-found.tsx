import Link from 'next/link';

export default function NotFound() {
    return (
        <main className='page-center'>
            <h1 className='heading-xl'>404 — Page not found</h1>
            <p className='muted'>
                We couldn&apos;t find the page you&apos;re looking for. It might
                have been moved or deleted.
            </p>
            <div className='spaced-top'>
                <Link href='/' className='home-link link-base'>
                    Take me home!
                </Link>
            </div>
        </main>
    );
}
