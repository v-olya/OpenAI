'use client';

import styles from '../../pages/coding/page.module.scss';
import chatStyles from '../chat/chat.module.scss';

const PRESETS = [
    {
        text: 'Convert PDF to SVG',
        file: 'doc.pdf',
    },
    {
        text: 'Describe the contents',
        file: 'letter.pdf',
    },
    {
        text: 'Refactor for readability',
        code: `
        def compute(values):
        s=0
        c=0
        for v in values:
            if v>0:
                s+=v;c+=1
        return s/c if c else 0

        if __name__=='__main__':
        print(compute([1,2,-3,4]))`,
    },
    {
        text: 'Create a test file',
        file: 'needs_tests.py',
    },
    {
        text: 'Summarize the data by year and plot a graph',
        file: 'sales.csv',
    },
];

export default function PresetList() {
    const handleClick = (p: { text: string; code?: string; file?: string }) => {
        // Dispatch a custom event that client components (like Chat) can listen to
        try {
            window.dispatchEvent(
                new CustomEvent('openai:preset', { detail: p })
            );
        } catch (e) {
            console.warn('Could not dispatch preset event', e);
        }
    };

    return (
        <div className={styles.presets}>
            {PRESETS.map((p, i) => (
                <button
                    key={`preset-${i}`}
                    type='button'
                    className={`${chatStyles.input} ${styles.preset}`}
                    onClick={() => handleClick(p)}
                >
                    <span>{p.text}</span>
                </button>
            ))}
        </div>
    );
}
