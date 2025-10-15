import ErrorView from './error-view/error-view';

export default function NotFound() {
    //throw new Error('Test error from /api/news-search/test-invalid/route.ts');

    return (
        <ErrorView
            title='404 — Page not found'
            message={`We couldn't find the page you're looking for.`}
        />
    );
}
