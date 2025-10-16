'use client';

export default function ResetButton({ label = 'Refresh' }: { label?: string }) {
    const handle = () => {
        try {
            // try to perform a client-side reload
            if (typeof window !== 'undefined' && window.location) {
                window.location.reload();
            }
        } catch {
            // fallback: navigate to root
            try {
                window.location.href = '/';
            } catch {}
        }
    };

    return (
        <button className='btn-small btn-primary' onClick={handle}>
            {label}
        </button>
    );
}
