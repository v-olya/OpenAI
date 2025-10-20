'use client';

import styles from './chat.module.scss';
import React, { useRef, useImperativeHandle, useState } from 'react';
import type { FileRowHandle } from '@/utils/types';
import { convertFiles } from '@/utils/convert-files';

interface FileRowProps {
    onFilesChange?: (files?: File[]) => void;
    disabled?: boolean;
}

const FileRow = React.forwardRef<FileRowHandle, FileRowProps>(
    ({ onFilesChange, disabled }, ref) => {
        const inputRef = useRef<HTMLInputElement | null>(null);
        const [files, setFilesState] = useState<File[] | undefined>(undefined);
        const currentConversion = useRef<Promise<void> | null>(null);
        const [isConverting, setIsConverting] = useState(false);

        const runConversion = async (f?: File[]) => {
            setIsConverting(true);
            currentConversion.current = (async () => {
                const converted = await convertFiles(f ?? []);
                setFilesState(converted);
                onFilesChange?.(converted);
            })();
            try {
                await currentConversion.current;
            } finally {
                setIsConverting(false);
            }
        };

        useImperativeHandle(ref, () => ({
            setFiles: async (f?: File[]) => await processFiles(f),
            getFiles: () => files,
        }));

        const processFiles = async (f?: File[]) => {
            if (!f || f.length === 0) {
                setFilesState(undefined);
                if (inputRef.current) inputRef.current.value = '';
                onFilesChange?.(undefined);
                return;
            }
            await runConversion(f);
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            (async () => {
                await processFiles(
                    e.target.files
                        ? Array.from(e.target.files)
                        : (undefined as File[])
                );
            })();
        };

        return (
            <div className={styles['file-row']}>
                <input
                    id='file-upload'
                    ref={inputRef}
                    type='file'
                    multiple
                    className={styles['native-file-input']}
                    onChange={handleChange}
                    disabled={disabled}
                />
                <div className={styles['file-control']}>
                    <button
                        type='button'
                        className={styles.input}
                        onClick={() => {
                            if (disabled) return;
                            if (files?.length) {
                                const ok = window.confirm(
                                    'Uploading new files will replace previously attached and start a new session. Are you sure to continue?'
                                );
                                if (!ok) return;
                            }
                            inputRef.current?.click();
                        }}
                        aria-label='Attach files'
                        data-has-files={
                            files && files.length > 0 ? 'true' : 'false'
                        }
                        disabled={disabled}
                    >
                        <span className={styles['input-text']}>
                            {files && files.length
                                ? files.map((f) => f.name).join(', ')
                                : 'Attach files if needed...'}
                        </span>
                        {isConverting && (
                            <span
                                style={{
                                    marginLeft: 8,
                                    fontSize: 12,
                                    color: '#666',
                                }}
                            >
                                Converting...
                            </span>
                        )}
                    </button>
                    <button
                        type='button'
                        className={`${styles.button} ${styles['button-rounded']} ${styles['clear-btn']}`}
                        onClick={() => {
                            if (disabled) return;
                            setFilesState(undefined);
                            if (inputRef.current) inputRef.current.value = '';
                            onFilesChange?.(undefined);
                        }}
                        disabled={disabled || !files?.length}
                        aria-hidden={!(files && files.length > 0)}
                        title='Clear attachments'
                    >
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            viewBox='0 0 24 24'
                            aria-hidden='true'
                            focusable='false'
                        >
                            <path
                                d='M6 6l12 12M6 18L18 6'
                                stroke='currentColor'
                                strokeWidth='3.2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                fill='none'
                            />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }
);

FileRow.displayName = 'FileRow';

export default FileRow;
