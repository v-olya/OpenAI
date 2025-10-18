"use client";

import type { ReactNode } from 'react';
import styles from './panel.module.scss';

interface PanelProps {
    children?: ReactNode;
    className?: string;
}

export default function Panel({ children, className = '' }: PanelProps) {
    return (
        <div className={`${styles.panel} ${className}`.trim()}>
            <div className={styles.data}>{children}</div>
        </div>
    );
}
