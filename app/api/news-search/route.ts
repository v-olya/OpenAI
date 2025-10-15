import { Message } from '@/types';

export const runtime = 'nodejs';

// Controlled by the server-side env var NEXT_PUBLIC_NEWS_SEARCH_FAKE_BACKEND.
// When true the route will use the mock SERP directly and skip OpenAI calls.

// Mock implementation: return 20 fake SERP results for a query
function mockFetchSerp(query: string) {
    const domains = [
        'example.com',
        'news.example.org',
        'localnews.it',
        'blog.example.com',
        'another-source.net',
    ];
    const lorem = ' Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
    const results = Array.from({ length: 20 }).map((_, i) => {
        const domain = domains[i % domains.length];
        return {
            title: `Event ${i + 1}`,
            snippet: `This is a mock snippet for result ${
                i + 1
            } related to ${query}.${lorem}`,
            url: `https://${domain}/${query.replace(/\s+/g, '-')}/${i + 1}`,
            domain,
            rank: i + 1,
        };
    });
    return { results };
}

// helper to create a placeholder image URL from a prompt
function placeholderImageForPrompt() {
    // Use a local preview image to avoid external dependencies and ensure caching
    return '/preview.jpg';
}

// Normalize a hostname/domain: lowercase and strip leading www.
function normalizeDomain(domain: string | undefined | null): string {
    if (!domain) return '';
    const d = domain.toLowerCase().trim();
    return d.startsWith('www.') ? d.slice(4) : d;
}

// Extract domain from a source object which may have { domain, url }
function domainFromSource(src: unknown): string {
    if (!src || typeof src !== 'object') return '';
    const s = src as Record<string, unknown>;
    if (typeof s.domain === 'string' && s.domain.trim().length > 0)
        return normalizeDomain(s.domain);
    if (typeof s.url === 'string' && s.url.trim().length > 0) {
        try {
            // Use URL constructor to get the exact hostname
            const u = new URL(s.url);
            return normalizeDomain(u.hostname);
        } catch {
            // If URL parsing fails, return empty string (no regex fallback to ensure exactness)
            return '';
        }
    }
    return '';
}

export async function POST(request: Request) {
    try {
        const { messages } = (await request.json()) as { messages: Message[] };

        // If configured, bypass OpenAI and use the mock SERP directly for testing.
        if (+process.env.NEXT_PUBLIC_NEWS_SEARCH_FAKE_BACKEND === 1) {
            // extract the last user message as the query
            const userMsg = Array.isArray(messages)
                ? messages
                      .slice()
                      .reverse()
                      .find((m) => m.role === 'user')
                : null;
            const query =
                userMsg && typeof userMsg.content === 'string'
                    ? userMsg.content
                    : '';

            const functionResult = mockFetchSerp(query || '');
            const results = Array.isArray(functionResult.results)
                ? functionResult.results
                : [];

            // Build up to 3 previews by grouping results two-per-preview where possible
            type Src = { domain?: string; url?: string };
            type ParsedPreview = {
                title?: string;
                summary?: string;
                sources?: Src[];
                url?: string;
                imagePrompt?: string;
            };
            const parsedPreviews: ParsedPreview[] = [];
            for (let i = 0; i < 3; i++) {
                const r1 = results[i * 2];
                const r2 = results[i * 2 + 1];
                if (!r1) break;
                const sources: Src[] = [];
                if (r1) sources.push({ domain: r1.domain, url: r1.url });
                if (r2) sources.push({ domain: r2.domain, url: r2.url });
                parsedPreviews.push({
                    title: r1.title || '',
                    summary: r1.snippet || '',
                    sources,
                    url: r1.url || '',
                    imagePrompt: r1.title || '',
                });
            }

            // validate previews using same logic as normal flow
            const previewDiagnostics: Array<Record<string, unknown>> = [];
            const invalid = parsedPreviews.some((p: unknown) => {
                const item =
                    p && typeof p === 'object'
                        ? (p as Record<string, unknown>)
                        : {};
                const sources = Array.isArray(item.sources) ? item.sources : [];
                const domains = (sources as unknown[])
                    .map((s) => domainFromSource(s))
                    .filter((d): d is string => d.length > 0);
                const unique = Array.from(new Set(domains));
                const title = typeof item.title === 'string' ? item.title : '';
                previewDiagnostics.push({ title, domains, unique });
                return unique.length < 2;
            });

            if (invalid) {
                const originalQuery = query || 'the locality';
                const userMessage = `No corroborated events available. All results for ${originalQuery} are mock snippets without concrete event details. Please try again later with real news data.`;
                return new Response(
                    JSON.stringify({
                        error: 'NO_VERIFIED_EVENTS',
                        userMessage,
                        details: {
                            query: originalQuery,
                            previews: parsedPreviews,
                            diagnostics: previewDiagnostics,
                        },
                    }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            }

            // For each preview, attach an image placeholder
            const previews = parsedPreviews
                .slice(0, 3)
                .map((p: ParsedPreview) => ({
                    title: p.title || '',
                    summary: p.summary || '',
                    sources: Array.isArray(p.sources) ? p.sources : [],
                    url: p.url || '',
                    image: placeholderImageForPrompt(),
                }));

            return new Response(JSON.stringify({ previews }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }
    } catch (err) {
        console.error('news-search route error:', err);
        const message = err.message ?? String(err);
        // Return a minimal standardized internal error code
        return new Response(
            JSON.stringify({ error: 'INTERNAL_ERROR', details: message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
