import { openai } from '@/app/openai';
import type { Message } from '@/app/openai';

export const runtime = 'nodejs';

// Toggle: when true the route will use the mock SERP directly and skip OpenAI calls.
// Controlled by the server-side env var NEWS_SEARCH_FAKE_BACKEND. Defaults to true when unset.
const USE_FAKE_BACKEND = (() => {
    try {
        const v = process.env.NEWS_SEARCH_FAKE_BACKEND;
        if (typeof v === 'undefined' || v === null) return true;
        return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
    } catch {
        return true;
    }
})();

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

// Mock article fetch: return dummy text and no real images
const fetchSerpFunction = {
    name: 'fetch_serp',
    description:
        'Fetch search engine results for a given query, return an array of results',
    parameters: {
        type: 'object',
        properties: {
            query: { type: 'string' },
            pages: { type: 'integer' },
        },
        required: ['query'],
    },
} as const;

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
        if (USE_FAKE_BACKEND) {
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

        // We'll run a two-step function-call loop synchronously for the demo.
        // 1) Ask the model. If it requests a function, execute the mock and append result.
        const functions = [fetchSerpFunction];

        // First call to the model (synchronous call to capture possible function_call)
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const initial = (await openai.chat.completions.create({
            model: 'gpt-4.1',
            messages,
            // cast functions to any to satisfy OpenAI typings for this demo
            functions: functions as any,
            function_call: 'auto',
        } as any)) as any;
        /* eslint-enable @typescript-eslint/no-explicit-any */

        const choice = initial.choices?.[0];
        if (!choice) {
            console.error('No choice returned from model', initial);
            return new Response(
                JSON.stringify({ error: 'No choice from model' }),
                { status: 500 }
            );
        }

        // If the model called a function, run the mock function and send results back
        // Check if the model requested a function call
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fc = (choice as any)?.message?.function_call;
        if (fc) {
            const name = fc.name as string;
            const argsRaw = fc.arguments ?? '{}';
            let args: Record<string, unknown> = {};
            try {
                args = JSON.parse(argsRaw as string);
            } catch {
                args = {};
            }

            let functionResult = {};
            if (name === 'fetch_serp') {
                functionResult = mockFetchSerp((args.query as string) ?? '');
            }

            // Append the function result to messages and call model again to produce final output
            const messagesWithFunction: Message[] = [
                ...messages,
                {
                    role: 'function',
                    name,
                    content: JSON.stringify(functionResult),
                } as Message,
            ];

            /* eslint-disable @typescript-eslint/no-explicit-any */
            const final = (await openai.chat.completions.create({
                model: 'gpt-4.1',
                messages: messagesWithFunction,
            } as any)) as any;
            /* eslint-enable @typescript-eslint/no-explicit-any */

            const finalChoice = final.choices?.[0];
            const finalMessage =
                (finalChoice?.message?.content as string) ?? '';

            // Try to parse model output as JSON array of previews
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let parsed: any = null;
            try {
                parsed = JSON.parse(finalMessage);
            } catch {
                const m = finalMessage.match(/\[[\s\S]*\]/);
                if (m) {
                    try {
                        parsed = JSON.parse(m[0]);
                    } catch {}
                }
            }

            if (Array.isArray(parsed)) {
                // For each preview, if imagePrompt present, try to generate an image
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const previews = [] as any[];
                // server-side validation: each preview must have >=2 distinct sources
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const previewDiagnostics: Array<Record<string, unknown>> = [];
                const invalid = parsed.some((p: unknown) => {
                    const item =
                        p && typeof p === 'object'
                            ? (p as Record<string, unknown>)
                            : {};
                    const sources = Array.isArray(item.sources)
                        ? item.sources
                        : [];
                    const domains = (sources as unknown[])
                        .map((s) => domainFromSource(s))
                        .filter((d): d is string => d.length > 0);
                    const unique = Array.from(new Set(domains));
                    const title =
                        typeof item.title === 'string' ? item.title : '';
                    previewDiagnostics.push({ title, domains, unique });
                    return unique.length < 2;
                });
                if (invalid) {
                    // use the original query (if present) to make the message specific
                    const originalQuery =
                        (args && (args.query as string)) || 'the locality';
                    // Log diagnostics to help debug cases like 'Torino'
                    console.warn(
                        'news-search validation failed, preview diagnostics:',
                        JSON.stringify(previewDiagnostics, null, 2)
                    );
                    // Compose a concise, user-facing message (single standardized message)
                    const userMessage = `No corroborated events available. All results for ${originalQuery} are mock snippets without concrete event details, making it impossible to identify events verified by at least two sources. Please try again later with real news data.`;
                    // Return a standardized error code and include the concise userMessage; diagnostics remain available for debugging.
                    return new Response(
                        JSON.stringify({
                            error: 'NO_VERIFIED_EVENTS',
                            userMessage,
                            details: {
                                query: originalQuery,
                                previews: parsed.slice(0, 3),
                                diagnostics: previewDiagnostics,
                            },
                        }),
                        {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' },
                        }
                    );
                }
                for (const p of parsed.slice(0, 3)) {
                    let imageUrl = p.image || null;
                    if (!imageUrl && p.imagePrompt) {
                        try {
                            // Try calling image generation (if available in the client).
                            // Use a narrow local interface to avoid explicit `any` casts.
                            type OpenAIImagesClient = {
                                images: {
                                    generate: (opts: {
                                        prompt: string;
                                        size?: string;
                                    }) => Promise<{
                                        data?: Array<{
                                            url?: string;
                                            b64_json?: string;
                                        }>;
                                    }>;
                                };
                            };
                            const imgResp = await (
                                openai as unknown as OpenAIImagesClient
                            ).images.generate({
                                prompt: p.imagePrompt,
                                size: '1024x512',
                            });
                            // Expecting data[0].url or b64_json
                            if (imgResp?.data?.[0]?.url) {
                                imageUrl = imgResp.data[0].url;
                            } else if (imgResp?.data?.[0]?.b64_json) {
                                imageUrl = `data:image/png;base64,${imgResp.data[0].b64_json}`;
                            }
                        } catch (err) {
                            console.error(
                                'Image generation failed, using placeholder',
                                err
                            );
                            imageUrl = placeholderImageForPrompt();
                        }
                    }
                    if (!imageUrl) {
                        imageUrl = placeholderImageForPrompt();
                    }
                    previews.push({
                        title: p.title || '',
                        summary: p.summary || '',
                        source: p.source || '',
                        url: p.url || '',
                        image: imageUrl,
                    });
                }

                return new Response(JSON.stringify({ previews }), {
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // Couldn't parse structured previews. Return a standardized parse-failure code with the raw text for server logs.
            return new Response(
                JSON.stringify({
                    error: 'PARSE_FAILURE',
                    details: finalMessage,
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // If no function was called, return a standardized error indicating unexpected model behavior
        const assistantContent = choice.message?.content ?? '';
        return new Response(
            JSON.stringify({
                error: 'PARSE_FAILURE',
                details: assistantContent,
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (err) {
        console.error('news-search route error:', err);
        let message = String(err);
        try {
            if (
                err &&
                typeof err === 'object' &&
                Object.prototype.hasOwnProperty.call(err, 'message')
            ) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                message = (err as any).message;
            }
        } catch {}
        // Return a minimal standardized internal error code. Details are included for logs but clients should only show a friendly message.
        return new Response(
            JSON.stringify({ error: 'INTERNAL_ERROR', details: message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
