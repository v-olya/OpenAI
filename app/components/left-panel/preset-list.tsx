'use client';

import { dispatchNewChat } from '@/utils/dispatch-new-chat';
import styles from '../../pages/coding/page.module.scss';
import chatStyles from '../chat/chat.module.scss';

export default function PresetList({ type }: { type: 'weather' | 'coding' }) {
    return (
        <div className={styles.presets}>
            {PRESETS[type].map((p, i) => (
                <button
                    key={`preset-${i}`}
                    type='button'
                    className={`${chatStyles.input} ${styles.preset}`}
                    onClick={() => dispatchNewChat(p)}
                >
                    <span>{p.text}</span>
                </button>
            ))}
        </div>
    );
}
// Code interpreter with Responses API currently rejects .py files,
// so pass the contents of /examples .py files as code: "string".

const PRESETS = {
    weather: [
        {
            text: 'Is London gloomy again?',
        },
        {
            text: 'Now in Tokyo...',
        },
        { text: "Why don't I take a trip to Hawaii?" },
    ],
    coding: [
        {
            text: 'Convert PDF to SVG',
            file: 'doc.pdf',
        },
        {
            text: 'Summarize in a few sentences',
            file: 'letter.pdf',
        },
        {
            text: 'Refactor the function for readability',
            code: `
        def compute(values):
            s = 0
            c = 0
            for v in values:
                if v > 0:
                    s += v
                    c += 1
            return s / c if c else 0

        if __name__ == '__main__':
            print(compute([1,2,-3,4]))`,
        },
        {
            text: 'Draw a diagram of sales by year',
            file: 'sales.csv',
        },
        {
            text: 'Create a test file for edge cases',
            file: 'needs_tests.py',
        },
    ],
};
