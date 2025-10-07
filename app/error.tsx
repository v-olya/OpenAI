'use client';

import ResetButton from './components/error-view/ResetButton';
import ErrorView from './components/error-view/ErrorView';

export default function GlobalError({ error }: { error?: Error }) {
    return (
        <ErrorView title='Something went wrong' message={error?.message}>
            <ResetButton />
        </ErrorView>
    );
}
