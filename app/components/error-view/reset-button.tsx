'use client';

export default function ResetButton({ label = 'Refresh' }: { label?: string }) {
    const handle = () => {
        try {
            if (typeof window !== 'undefined' && window.location) {
                window.location.reload();
            }
        } catch {
            window.location.href = '/';
        }
    };

    return (
        <button className='btn-small btn-primary' onClick={handle}>
            {label}
        </button>
    );
}
