'use client';

import { useEffect } from 'react';

export default function MenuUnderwatch() {
    useEffect(() => {
        const menu = document.querySelector('.top-menu');
        const messages = document.getElementById('messages');
        if (!menu || !messages) return;

        let rafId: number | null = null;
        let lastUnder: string | null = null;

        function pickTokenFromElement(el: Element | null) {
            if (!el) return null;
            const role = (el as HTMLElement).dataset?.role;
            if (role) return role;
            if (el.closest('[data-role="assistant"]')) return 'assistant';
            return null;
        }

        function update() {
            rafId = null;
            const rect = menu.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            const hits = document.elementsFromPoint(x, y);

            let token: string | null = null;
            for (const el of hits) {
                if (el === menu || menu.contains(el)) continue;
                token = pickTokenFromElement(el);
                if (token) break;
            }

            if (!token) token = 'none';

            if (token !== lastUnder) {
                menu.setAttribute('data-under', token);
                lastUnder = token;
            }
        }

        function schedule() {
            if (rafId != null) return;
            rafId = requestAnimationFrame(update);
        }

        // Listen to the messages scrolling and element resize.
        // Use `schedule` directly as the scroll handler to keep code minimal.
        messages.addEventListener('scroll', schedule, { passive: true });

        const ro = new ResizeObserver(() => {
            schedule();
        });
        ro.observe(messages);
        ro.observe(menu);

        return () => {
            if (rafId != null) cancelAnimationFrame(rafId);
            messages.removeEventListener('scroll', schedule);
            ro.disconnect();
        };
    }, []);

    return null;
}
