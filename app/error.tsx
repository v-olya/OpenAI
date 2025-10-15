'use client';

import ResetButton from './components/error-view/reset-button';
import ErrorView from './components/error-view/error-view';

export default function GlobalError({ error }: { error?: Error }) {
    return (
        <ErrorView title='Something went wrong' message={error?.message}>
            <ResetButton />
        </ErrorView>
    );
}
